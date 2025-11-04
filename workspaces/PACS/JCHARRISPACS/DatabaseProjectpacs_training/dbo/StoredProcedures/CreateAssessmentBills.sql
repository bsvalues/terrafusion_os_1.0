
create procedure [dbo].[CreateAssessmentBills]
	@effective_due_date datetime,
	@pacs_user_id	int,
	@year	numeric(4,0) = 0,
	@datasetID bigint = -1

with recompile 

as

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(400)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
  
 SET @qry = 'Start - ' + @proc  
 + ' @effective_due_date =' +  convert(varchar(30),@effective_due_date,120) + ','
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @datasetID =' +  convert(varchar(30),@datasetID) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
	
	-- Set Year to the current year layer if it is not received on input
	if @year = 0
	begin
		select top 1 @year = appr_yr from pacs_system with(nolock)
	end
	
	-- Assessment Bills can be created only if the Assessment Sub-system is certified
	-- otherwise return			
	
	-- Construct the working list of special assessments
	declare @assessments_list table 
	(
		[year] numeric(4,0) not null,
		sup_num int not null,
		prop_id int not null,	
		agency_id int not null,
		owner_id int not null,
		base_tax_due numeric(14,2),
		fee_due numeric(14,2),
		fee_type_cd varchar(10),
		primary key clustered 
		(
			[year],
			sup_num,
			prop_id,
			agency_id
		)
	)

	-- If dataset = -1, then working set of assessments is the set of all assessments
	-- in the provided tax_year and 
	-- for as a safety check the query also checks if the join returns the assessments 
	-- in 'CERT' status
	if @datasetID = -1
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start' --logging 

		insert @assessments_list
		select 
			@year,			
			psa.sup_num,
			prsa.prop_id,
			sa.agency_id,
			o.owner_id,
			isnull(prsa.assessment_amt, 0),-- This is already calculated in TACalculationBuilder.CalculationModelSpecialAssessment - isnull(prsa.exemption_amt, 0),
			isnull(prsa.additional_fee_amt, 0),
			sa.fee_type_cd
		from special_assessment as sa with(nolock)
		join (
				select psa.*
				from property_special_assessment as psa with(nolock)
				where not exists 
				(	
					select * from assessment_bill as ab with(nolock)
					join bill as b with(nolock) on b.bill_id = ab.bill_id
					where	b.[year]		= psa.[year]
					and 	b.prop_id		= psa.prop_id
					and		ab.agency_id	= psa.agency_id
				)
			) 
		as prsa on	
			prsa.[year]			= sa.[year] 
		and	prsa.agency_id		= sa.agency_id
		join prop_supp_assoc as psa with(nolock) on
			psa.owner_tax_yr	= prsa.[year]
		and psa.sup_num			= prsa.sup_num
		and psa.prop_id			= prsa.prop_id
		join property_val as pv with(nolock) on
			psa.owner_tax_yr	= pv.prop_val_yr
		and psa.sup_num			= pv.sup_num
		and psa.prop_id			= pv.prop_id
		and pv.prop_inactive_dt is null
		join [owner] as o with(nolock) on
			o.owner_tax_yr		= psa.owner_tax_yr
		and o.sup_num			= psa.sup_num
		and o.prop_id			= psa.prop_id
		where sa.[year]			= @year
		and sa.status_cd		= 'CERT'
		and isnull(pv.udi_parent, 'F') = 'F'
		and isNull(prsa.assessment_amt, 0) > 0

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end		
	else  
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start' --logging 

		insert @assessments_list
		select 
			@year,			
			psa.sup_num,
			prsa.prop_id,
			sa.agency_id,
			o.owner_id,
			isnull(prsa.assessment_amt, 0),-- - isnull(prsa.exemption_amt, 0),
			isnull(prsa.additional_fee_amt, 0),
			sa.fee_type_cd
		from ##assessments_list_for_bill_functions as al with(nolock) 
		join special_assessment as sa with(nolock) on
			sa.agency_id	= al.agency_id
		join (
				select psa.*
				from property_special_assessment as psa with(nolock)
				where not exists 
				(	
					select * from assessment_bill as ab with(nolock)
					join bill as b with(nolock) on b.bill_id = ab.bill_id
					where	b.[year]		= psa.[year] 
					and 	b.prop_id		= psa.prop_id
					and		ab.agency_id	= psa.agency_id
				)
			) 
		as prsa on	
			prsa.[year]			= sa.[year] 
		and	prsa.agency_id		= sa.agency_id
		join prop_supp_assoc as psa with(nolock) on
			psa.owner_tax_yr	= prsa.[year]
		and psa.sup_num			= prsa.sup_num
		and psa.prop_id			= prsa.prop_id
		join property_val as pv with(nolock) on
			psa.owner_tax_yr	= pv.prop_val_yr
		and psa.sup_num			= pv.sup_num
		and psa.prop_id			= pv.prop_id
		and pv.prop_inactive_dt is null
		join [owner] as o with(nolock) on
			o.owner_tax_yr		= psa.owner_tax_yr
		and o.sup_num			= psa.sup_num
		and o.prop_id			= psa.prop_id
		where	al.dataset_id	= @datasetID
		and		sa.[year]		= @year
		and		sa.status_cd	= 'CERT'
		and isnull(pv.udi_parent, 'F') = 'F'
		and isNull(prsa.assessment_amt, 0) > 0

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end 	
	
set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Cursor Start' --logging 
	
	-- declare variables a cursor to process each property and create assessment bills

	declare 	
		@sup_num int,
		@prop_id int,
		@owner_id int,
		@agency_id int,
		@property_assessment_amt numeric(14, 2),
		@property_additional_fee_amt numeric(14, 2),
		@base_tax_due numeric(14,2),
		@bill_id int,
		@transaction_id int,
		@fee_id int,
		@fee_type_cd varchar(10),
		@fee_create_date datetime
 
	declare billData cursor fast_forward for 
		select
			al.sup_num,
			al.prop_id,
			al.owner_id,
			al.agency_id,
			al.base_tax_due,
			al.fee_due,
			al.fee_type_cd
		from @assessments_list as al
		--just to be sure that no 0 bills are created
		where isNull(al.base_tax_due, 0) > 0
		
	-- begin processing each record
	set nocount on
	open billData
	fetch next from billData into
		@sup_num, @prop_id, @owner_id, @agency_id,
		@property_assessment_amt, @property_additional_fee_amt,
		@fee_type_cd

	while @@fetch_status = 0
	begin
		
		-- Set Base Tax Due Amount = Property Assessment Amount
		-- During Assessment Calculation Process, the Assessment Amount on the amount will be 
		-- set to calculated amount (using calculation rules) + any flat fee (if flat_fee = 1)
		-- the flat fee will be come from the [special_assessment.assessment_fee_amt]
		-- However this overall computation is invisible to the Bill Creation Process and 
		-- it only looks at [property_special_assessment.assessment_amt]
		set @base_tax_due = @property_assessment_amt

		
		-- Get a new trans_group_id (to be used as bill_id across the board)
		exec GetUniqueID 'trans_group', @bill_id output
			
		-- create the trans group record
		insert into trans_group (trans_group_id, trans_group_type)
		values (@bill_id, 'AB')

		-- create a record in the bill table
		insert into bill
		(
			bill_id,
			prop_id,
			[year],
			sup_num,
			owner_id, 
			initial_amount_due,
			current_amount_due,
			amount_paid,
			effective_due_date,
			bill_type,
			is_active,
			created_by_type_cd	
		)
		values
		(
			@bill_id,
			@prop_id,
			@year,
			@sup_num,
			@owner_id,
			@base_tax_due,
			@base_tax_due,
			0,
			@effective_due_date,
			'A',
			0,
			'CERT'
		)

		-- create the corresponding assessment bill record
		insert into assessment_bill
		(
			[year],
			agency_id,
			bill_id	
		)
		values
		(
			@year,
			@agency_id,
			@bill_id
		)

		-- create a single record in the bill_payments_due table
		-- for this bill reflecting the amount required to pay
		-- off the bill
		insert into bill_payments_due
		(
			bill_id,
			bill_payment_id,
			amount_due,
			amount_paid,
			due_date
		)
		values
		(
			@bill_id,
			0,					-- payment_id is 0 indicating the first record
			@base_tax_due,
			0,
			@effective_due_date
		)
		 
		-- get a new transaction id for the 'Create Bill' transaction
		exec GetUniqueID 'coll_transaction', @transaction_id output

		-- create a pending_coll_transaction record for this bill
		insert into pending_coll_transaction
		(
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
			pacs_user_id,
			transaction_date
		)
		values
		(
			@transaction_id,
			@bill_id,
			@base_tax_due,
			0,						-- base_amount_pd
			0,						-- penalty_amount_pd
			0,						-- interest_amount_pd
			0,						-- bond_interest_pd
			'CAB', 					-- transaction_type
			0,						-- underage_amount_pd
			0,						-- overage_amount_pd
			0,						-- other_amount_pd
			@pacs_user_id,
			getdate()
		)

		
		-- if assessment imposes an administrative fee 
		-- then create a new record in the [fee] table
		if @property_additional_fee_amt > 0
		begin
			
			-- Get a new trans_group_id for this fee
			exec GetUniqueID 'trans_group', @fee_id output

			-- create the trans group record for this fee
			insert into trans_group (trans_group_id, trans_group_type)
			values (@fee_id, 'F')

			-- create the actual fee record
			set @fee_create_date = getdate()
			insert into fee
			(
				fee_id,
				[year],
				fee_type_cd,
				owner_id,
				initial_amount_due,
				current_amount_due,
				amount_paid,
				effective_due_date,
				comment,
				fee_create_date,
				last_modified,
				is_active								
			)
			values
			(
				@fee_id,
				@year,
				@fee_type_cd,
				@owner_id,
				@property_additional_fee_amt,
				@property_additional_fee_amt,
				0,
				@effective_due_date,
				'Assessment Administrative Fee',
				@fee_create_date,
				@fee_create_date,
				0
			)

			-- create a single record in the fee_payments_due table
			-- for this fee
			
			insert into fee_payments_due
			(
				fee_id,
				fee_payment_id,
				[year],
				amount_due,
				amount_paid,
				due_date
			)
			values
			(
				@fee_id,
				0,
				@year,
				@property_additional_fee_amt,
				0,
				@effective_due_date
			)

			-- get a new transaction id for the 'Create Fee' transaction
			exec GetUniqueID 'coll_transaction', @transaction_id output

			-- create a pending_coll_transaction record for the fee
			insert into pending_coll_transaction
			(
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
				pacs_user_id,
				transaction_date
			)
			values
			(
				@transaction_id,
				@fee_id,
				@property_additional_fee_amt,
				0,						-- base_amount_pd
				0,						-- penalty_amount_pd
				0,						-- interest_amount_pd
				0,						-- bond_interest_pd
				'CF', 					-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate()
			)

			-- insert a record in the bill_fee_assoc table
			-- to associate this fee with the corresponding bill
			insert into bill_fee_assoc
			(
				bill_id,
				fee_id
			)
			values
			(
				@bill_id,
				@fee_id
			)

		end		
		
		fetch next from billData into
			@sup_num, @prop_id, @owner_id, @agency_id,
			@property_assessment_amt, @property_additional_fee_amt,
			@fee_type_cd
	end

	close billData
	deallocate billData

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 3 Cursor End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	declare @pacs_user_name varchar(30)
	select @pacs_user_name = pacs_user_name from pacs_user with(nolock) where pacs_user_id = @pacs_user_id

	if @datasetID = -1
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 

		-- Update the status on the assessments in the working set to 'Bill Created'
		update special_assessment
		set status_cd = 'BC', bill_create_date = getdate(), bills_createdby = @pacs_user_name
		from special_assessment as sa with(nolock)
		where sa.[year]			= @year
		and sa.status_cd		= 'CERT'

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end
	else
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Start' --logging 

		update special_assessment
		set status_cd = 'BC', bill_create_date = getdate(), bills_createdby = @pacs_user_name
		from special_assessment as sa with(nolock)
		join ##assessments_list_for_bill_functions as al with(nolock) on
			sa.agency_id	= al.agency_id
		where sa.year = @year
		and al.dataset_id = @datasetID
		and sa.status_cd = 'CERT'

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end
					 		

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

