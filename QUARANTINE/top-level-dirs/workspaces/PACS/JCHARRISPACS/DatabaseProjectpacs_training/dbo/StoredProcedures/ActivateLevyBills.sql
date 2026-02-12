
/******************************************************************************************
 Procedure: ActivateLevyBills
 Synopsis:	Activate Levy Bill Records for the most recent accepted Levy Certification
			Run.  This causes records to be created in coll_transaction, and existing
			records in the bill table with bill_type 'L' to be updated.
			
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE ActivateLevyBills
	@pacs_user_id		int,
	-- optional, if not provided the first 'Accepted' status Levy Certification Run is used
	@year				numeric(4, 0) = 0,		
	@levy_cert_run_id	int	= 0,
	@batch_id	int	= -1
AS
	set nocount on
	declare @return_message varchar(255)
	
	if @year = 0 or @levy_cert_run_id = 0
		begin
			-- get the current certified year for which an Accepted Levy Certification Run 
			-- exists that Levy Bills have not yet been created

			if not exists(
				select * 
				from levy_cert_run as lcr with (nolock) 
				join pacs_year as py with (nolock) on
					py.tax_yr = lcr.[year]
				where	lcr.status = 'Bills Created'
					and py.certification_dt is not null
			)
			begin
				set @return_message = 'No Levy Certification Run exists for which levy bills have been created, but not activated.'
				goto quit
			end
			
			select 
				@levy_cert_run_id = lcr.levy_cert_run_id,
				@year = lcr.[year]
			from levy_cert_run as lcr with (nolock) 
			join pacs_year as py with (nolock) on py.tax_yr = lcr.[year]
			where lcr.status = 'Bills Created'
--				and py.certification_dt is not null 
		end
	else
		begin
			if not exists
			(
				select * 
				from levy_cert_run as lcr with (nolock) 
				join pacs_year as py with (nolock) on
					py.tax_yr = lcr.[year]
				where 
						lcr.levy_cert_run_id	= @levy_cert_run_id
					and lcr.[year]				= @year
					and lcr.status				= 'Bills Created'
--					and py.certification_dt		is not null 
			)
			begin
				set @return_message = 'The specified Levy Certification Run must have an "Bills Created" status.'
				goto quit
			end
		end
	
		
	if @batch_id <= 0 or exists (	select * 
																from batch with (nolock)
																where batch_id = @batch_id
																and isNull(close_dt, '') <> '')
	begin
		set @return_message = 'The batch id selected ' + cast(@batch_id as varchar(10)) + 'is closed or is invalid.'
		goto quit
	end
	
	
	--Copy BPP Fee pending_coll_transaction records
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
		@batch_id
	from pending_coll_transaction as pct with (nolock) 
	join fee with (nolock) on
			fee.fee_id = pct.trans_group_id
	join bill_fee_assoc as bfa with(nolock)
		on bfa.fee_id = fee.fee_id
	join bill with(nolock)
		on bill.bill_id = bfa.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and pct.transaction_type = 'CF'
		and bill.created_by_type_cd = 'CERT'
	
	
	-- copy pending_coll_transaction records to coll_transaction
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
		@batch_id
	from pending_coll_transaction as pct with (nolock) 
	join bill with (nolock) on
			bill.bill_id = pct.trans_group_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and pct.transaction_type = 'CLB'
		and bill.created_by_type_cd = 'CERT'

	-- Activate Levy Bills and Fees associated with records in levy_supp_assoc
	update fee set
		is_active = 1
	from fee
	join bill_fee_assoc as bfa with (nolock) 
		on bfa.fee_id = fee.fee_id
	join bill with (nolock)
		on bill.bill_id = bfa.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd = 'CERT'

	update bill set
		is_active = 1
	from bill
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd = 'CERT'

			
	-- update the levy_cert_run table
	update levy_cert_run set
		bills_activated_date = getdate(),
		bills_activated_by_id = @pacs_user_id,
		[status]			= 'Bills Activated'
	where	levy_cert_run_id = @levy_cert_run_id
		and [year] = @year


	--update sup group records 
	update sg set 
		sup_bill_status = 'BA'
	from sup_group sg
	where sg.sup_group_id in 
		(	select sup_group_id
			from supplement s
			where s.sup_tax_yr = @year
			and s.levy_cert_run_id = @levy_cert_run_id) and
		sg.sup_group_id not in 
		(	select sup_group_id
			from supplement
			where sup_tax_yr <> @year) and
		isNull(sg.status_cd, 'C') = 'BC'


	-- delete the pending coll transaction records
	delete from pending_coll_transaction
	from pending_coll_transaction as pct with (nolock) 
	join bill with (nolock) on
			bill.bill_id = pct.trans_group_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 1
		and pct.transaction_type = 'CLB'
		and bill.created_by_type_cd = 'CERT'

		
	delete from pending_coll_transaction
	from pending_coll_transaction as pct with (nolock)
	join fee
		on fee.fee_id = pct.trans_group_id
	join bill_fee_assoc as bfa with (nolock) 
		on bfa.fee_id = fee.fee_id
	join bill with (nolock)
		on bill.bill_id = bfa.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(fee.is_active, 0)	= 1
		and isnull(bill.is_active, 0)	= 1
		and bill.created_by_type_cd = 'CERT'
		and pct.transaction_type = 'CF'

	
	--------------------------Update Fiscal Year Beginning Balances
	exec SetFiscalYearBeginBalances @year, 0
	
	--------------------------Create Zero Due Rollback Bills
	if @batch_id > 0
	begin
		exec GenerateRollbackZeroBills @pacs_user_id, @batch_id, @year
	end

quit:
	select @return_message as return_message
	set nocount off

GO

