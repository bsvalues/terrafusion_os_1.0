
CREATE procedure ManuallyCreateAssessmentBills
  @prop_id int,
	@effective_due_date datetime,
	@pacs_user_id int,
	@supplemental_bill int,
	@modify_code varchar(10),
	@modify_reason varchar(500),	
	@datasetID bigint,
  @year numeric(4,0) = 0,
	@statement_id int = 0,
	@batch_id int = 0
as
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
		agency_id int not null,
		owner_id int not null,
		base_tax_due numeric(14,2),
		primary key clustered
		(
			[year],
			sup_num,
			agency_id
		)
	)

		insert @assessments_list
		select
			@year,			
			isnull(psa.sup_num, -1),
			sa.agency_id,
			isnull(isnull(o.owner_id, p.col_owner_id), -1),
			al.assessment_amt
		from ##assessments_list_for_bill_functions as al with(nolock)
		join special_assessment as sa with(nolock)
			on sa.agency_id	= al.agency_id
		join property as p with(nolock)
			on p.prop_id = @prop_id
		left join prop_supp_assoc as psa with(nolock)
			on psa.owner_tax_yr	= @year
			and psa.prop_id	= @prop_id
		left join [owner] as o with(nolock)
			on o.owner_tax_yr = psa.owner_tax_yr
			and o.sup_num = psa.sup_num
			and o.prop_id = psa.prop_id
		where al.dataset_id	= @datasetID
			and	sa.[year] = @year

	
	-- declare variables a cursor to process each property and create assessment bills
	declare 	
		@sup_num int,
		@owner_id int,
		@agency_id int,
		@property_assessment_amt numeric(14,2),
		@base_tax_due numeric(14,2),
		@bill_id int,
		@bill_adj_id int,
		@transaction_id int
		
	declare billData cursor fast_forward for
		select
			al.sup_num,
			al.owner_id,
			al.agency_id,
			al.base_tax_due
		from @assessments_list as al		
		
	-- begin processing each record
	set nocount on
	open billData
	fetch next from billData into
		@sup_num, @owner_id, @agency_id, @property_assessment_amt

	while @@fetch_status = 0
	begin	
		-- Verify that a property_special_assessment record already exists, or if it does not, that
		-- we are in an uncertified year and can add a property_special_assessment record.
		if not exists(
			select * from property_special_assessment 
			where [year] = @year and sup_num = @sup_num and prop_id = @prop_id
			and agency_id = @agency_id)
		begin
			-- we will need to create it if we can
			-- Make sure the year is assessment uncertified first
			if exists(select * from pacs_year where tax_yr = @year + 1 and assessment_certification_date is not null)
			begin
				raiserror('The Assessment Year is Certified.  An assessment bill cannot be manually created for the property because it is not associate with the Special Assessment.', 10, 1);
				return -1;
			end
			
			-- We also need to make sure the special assessment is not in coding
			if exists(
				select * from special_assessment 
				where [year] = @year and agency_id = @agency_id and status_cd = 'C')
			begin
				raiserror('An assessment bill cannot be manually created for the property because the selected Special Assessment is still in a Coding status.', 10, 2);
				return -1;
			end			
			
			-- Having passed all those tests, we can now create the record
			insert into property_special_assessment
			([year], sup_num, prop_id, agency_id, assessment_use_cd, assessment_amt, additional_fee_amt, exemption_amt)
			values(@year, @sup_num, @prop_id, @agency_id, NULL, @property_assessment_amt, 0, 0)
		end			
	
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
			statement_id,
			is_active,
			created_by_type_cd,
			last_modified,
			payment_status_type_cd
		)
		values
		(
			@bill_id,
			@prop_id,
			@year,
			@sup_num,
			@owner_id,
			0,
			@base_tax_due,
			0,
			@effective_due_date,
			(case when @supplemental_bill = 1 then 'MCSA' else 'MCA' end),
			@statement_id,
			1,
			(case when @supplemental_bill = 1 then 'SUP' else 'MC' end),
			getdate(),
			'FULL'
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
		exec dbo.GetUniqueID 'coll_transaction', @transaction_id output

		-- create a coll_transaction record for this bill
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
		values
		(
			@transaction_id,
			@bill_id,
			0,
			0,						-- base_amount_pd
			0,						-- penalty_amount_pd
			0,						-- interest_amount_pd
			0,						-- bond_interest_pd
			'CAB', 					-- transaction_type
			0,						-- underage_amount_pd
			0,						-- overage_amount_pd
			0,						-- other_amount_pd
			@pacs_user_id,
			getdate(),
			@batch_id
		)
		
		-- INSERT DATA INTO bill_adjustment
		
		-- generate transaction_id for that
		exec GetUniqueID 'coll_transaction', @transaction_id output

		-- create a coll_transaction record for this bill_adjustment
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
		values
		(
			@transaction_id,
			@bill_id,
			@base_tax_due,
			0,						-- base_amount_pd
			0,						-- penalty_amount_pd
			0,						-- interest_amount_pd
			0,						-- bond_interest_pd
			'ADJAB', 					-- transaction_type
			0,						-- underage_amount_pd
			0,						-- overage_amount_pd
			0,						-- other_amount_pd
			@pacs_user_id,
			getdate(),
			@batch_id
		)		
		
		exec GetUniqueID 'bill_adjustment', @bill_adj_id output
		
		insert into dbo.bill_adjustment
    (
      bill_adj_id,
      bill_id,
      transaction_id,
      batch_id,
      modify_cd,
      modify_reason,
			sup_num,
			previous_effective_due_dt,
			effective_due_dt,
      bill_calc_type_cd,
		  previous_base_tax,
      base_tax
    )
    values 
    (
			@bill_adj_id, 
			@bill_id, 
			@transaction_id, 
			null, 
			@modify_code, 
			@modify_reason,
			@sup_num,
			null,
			@effective_due_date,
			(case when @supplemental_bill = 1 then 'MCSA' else 'MCA' end),
			0,
			@base_tax_due
		)

		-- END OF INSERT DATA INTO bill_adjustment
		
		if NOT EXISTS (SELECT * FROM property_special_assessment as psa 
WHERE psa.year=@year AND psa.sup_num=@sup_num AND psa.prop_id=@prop_id AND psa.agency_id = @agency_id)
			
			begin
				insert into property_special_assessment 
				(
					year, 
					sup_num,
					prop_id,
					agency_id,
					assessment_amt
				)
				values
				(
					@year,
					@sup_num,
					@prop_id,
					@agency_id,
					@base_tax_due
				)
			end		
		fetch next from billData into
			@sup_num, @owner_id, @agency_id, @property_assessment_amt
	end

	close billData
	deallocate billData

GO

