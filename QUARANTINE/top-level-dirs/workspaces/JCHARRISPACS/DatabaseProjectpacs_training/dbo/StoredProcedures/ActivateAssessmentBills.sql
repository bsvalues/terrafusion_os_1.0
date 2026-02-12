
/******************************************************************************************
 Procedure: ActivateAssessmentBills
 Synopsis:	
			
 Call From:	App Server
******************************************************************************************/

create procedure ActivateAssessmentBills
	@pacs_user_id	int,
	@year	numeric(4,0) = 0,
	@datasetID bigint = -1,
	@batchID int = -1
as

	declare @return_message varchar(255)
	-- Set Year to the current year layer if it is not received on input
	if @year = 0
	begin
		select top 1 @year = appr_yr from pacs_system with(nolock)
	end
	
	if @batchID <= 0 or exists (	select * 
																from batch with (nolock)
																where batch_id = @batchID
																and isNull(close_dt, '') <> '')
	begin
		set @return_message = 'The batch id selected ' + cast(@batchID as varchar(10)) + 'is closed or is invalid.'
		goto quit
	end

	-- Construct the working list of special assessments
	declare @assessment_bill_list table 
	(
		[year] numeric(4,0) not null,
		agency_id int not null,
		bill_id int not null,
		primary key clustered 
		(
			bill_id
		)
	)

	-- If dataset = -1, then working set of assessments is the set of all assessments
	-- in the provided tax_year and 
	-- for as a safety check the query also checks if the join returns the assessments 
	-- in 'Bill Created' status
	if @datasetID = -1
	begin
		insert @assessment_bill_list
		select 
				ab.[year], 
				ab.agency_id, 
				ab.bill_id
		from assessment_bill as ab with(nolock)
		join bill as b with(nolock) on
				ab.bill_id				= b.bill_id
		where	ab.[year]				= @year
		and		b.bill_type				= 'A'
		and		isnull(b.is_active, 0)	= 0
		
	end
	else
	begin
		insert @assessment_bill_list
		select 
				ab.[year], 
				ab.agency_id, 
				ab.bill_id	
		from ##assessments_list_for_bill_functions as al with(nolock)
		join assessment_bill as ab with(nolock)on 
				ab.agency_id			= al.agency_id
		join bill as b with(nolock) on
				ab.bill_id				= b.bill_id		
		where	al.dataset_id			= @datasetID
		and		ab.[year]				= @year
		and		b.bill_type				= 'A'
		and		isnull(b.is_active, 0)	= 0		
	end
	
	-- copy pending_coll_transaction records to coll_transaction (bill)
	insert into coll_transaction
	(
		transaction_id,
		trans_group_id,
		base_amount,
		base_amount_pd,
		penalty_amount_pd,
		interest_amount_pd,
		bond_interest_pd,
		transaction_type,
		underage_amount_pd,
		overage_amount_pd,
		other_amount_pd,
		pacs_user_id,
		transaction_date,
		batch_id
	)
	select
		pending_transaction_id,
		trans_group_id,
		base_amount,
		base_amount_pd,
		penalty_amount_pd,
		interest_amount_pd,
		bond_interest_pd,
		transaction_type,
		underage_amount_pd,
		overage_amount_pd,
		other_amount_pd,
		@pacs_user_id,
		getdate(),
		@batchID
	from pending_coll_transaction as pct with (nolock)
	join @assessment_bill_list as al on
			al.bill_id = pct.trans_group_id
	where pct.transaction_type = 'CAB'

	-- copy pending_coll_transaction records to coll_transaction (fee)
	insert into coll_transaction
	(
		transaction_id,
		trans_group_id,
		base_amount,
		base_amount_pd,
		penalty_amount_pd,
		interest_amount_pd,
		bond_interest_pd,
		transaction_type,
		underage_amount_pd,
		overage_amount_pd,
		other_amount_pd,
		pacs_user_id,
		transaction_date,
		batch_id
	)
	select
		pending_transaction_id,
		trans_group_id,
		base_amount,
		base_amount_pd,
		penalty_amount_pd,
		interest_amount_pd,
		bond_interest_pd,
		transaction_type,
		underage_amount_pd,
		overage_amount_pd,
		other_amount_pd,
		@pacs_user_id,
		getdate(),
		@batchID
	from pending_coll_transaction as pct with (nolock)
	join bill_fee_assoc as bfe with (nolock) on
			bfe.fee_id				= pct.trans_group_id
	join @assessment_bill_list as al on
			al.bill_id				= bfe.bill_id

	-- Activate Fees and Bills associated with records in @assessment_bill_list
	update fee set
		is_active = 1
	from fee with (nolock)
	join bill_fee_assoc as bfa with (nolock)
		on bfa.fee_id = fee.fee_id
	join @assessment_bill_list as al on
		al.bill_id = bfa.bill_id

	update bill set
		is_active = 1
	from bill as b
	join @assessment_bill_list as al on
		al.bill_id = b.bill_id

	-- Update the status on the assessments in the working set back to 'Bills Activated'
	if @datasetID = -1
	begin
		-- Update the status on the assessments in the working set to 'Bill Created'
		update special_assessment
		set status_cd = 'BA', bill_create_date = getdate()
		from special_assessment as sa with(nolock)
		where sa.[year]			= @year
		and sa.status_cd		= 'BC'
	end
	else
	begin
		update special_assessment
		set status_cd = 'BA', bill_create_date = getdate()
		from special_assessment as sa with(nolock)
		join ##assessments_list_for_bill_functions as al with(nolock) on
			sa.agency_id	= al.agency_id
		where sa.year = @year
		and al.dataset_id = @datasetID
		and sa.status_cd = 'BC'
	end

	--delete pending_coll_transaction records
	delete from pct
	from pending_coll_transaction pct with(nolock)
	join @assessment_bill_list as al on
			al.bill_id = pct.trans_group_id
	where pct.transaction_type = 'CAB'
	
	
	--------------------------Update Fiscal Year Beginning Balances
	exec SetFiscalYearBeginBalances @year, 1

quit:
	select @return_message as return_message
	set nocount off

GO

