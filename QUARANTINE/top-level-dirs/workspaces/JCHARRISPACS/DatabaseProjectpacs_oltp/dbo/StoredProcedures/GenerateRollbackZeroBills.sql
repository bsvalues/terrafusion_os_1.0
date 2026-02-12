
CREATE PROCEDURE [dbo].[GenerateRollbackZeroBills]
	@pacs_user_id		int,
	@batch_id int = 0,
	@tax_yr numeric(4,0) = 0

AS
	set nocount on
	
	if(@tax_yr = 0)
	begin
		select @tax_yr = max(year) 
		from levy_cert_run
		where isNull(bills_created_date, '') <> ''
	end

	declare @sql varchar(max)
	-- YES I KNOW this seems totally retarded but SQL is acting like a dumb@$$
	-- and putting in the hardcoded years was the only way to make it run
	-- sooner than rapture

	set @sql = '
	DECLARE
	@sup_num				int,
	@prop_id				int,
	@owner_id				int,
	@tax_district_id		int,
	@levy_cd				varchar(10),
	@taxable_val			numeric(14, 0),
	@bill_id				int,
	@base_tax_due			numeric(14, 2),
	@transaction_id			int,
	@bill_adjustment_amount	numeric(14,2),
	@bill_adj_id			int,
	@rollback_id			int,
	@effective_due_date		datetime,
	@statement_id			int,
	@currentPropID			int,
	@payment_group_id		int,
	@tax_area_id			int
	
	set @currentPropID = -1

	declare rollbackData cursor fast_forward for
	select distinct
				b.rollback_id,
				b.prop_id, 
				b.effective_due_date,
				b.owner_id,
				b.payment_group_id,
				pta.tax_area_id,
				pta.sup_num,
				tafa.tax_district_id,
				tafa.levy_cd
				
				from bill b with (nolock)
				
				join property_tax_area pta with(nolock) on 
					pta.year = ' + convert(varchar(4), @tax_yr) + '
					and pta.sup_num = b.sup_num
					and pta.prop_id = b.prop_id
				
				join tax_area_fund_assoc tafa with (nolock) on
					tafa.tax_area_id = pta.tax_area_id
					and tafa.year = pta.year
				
				join (	select sum(base_amount) amount_due, trans_group_id 
						from coll_transaction with (nolock)
						group by trans_group_id) ct on
					b.bill_id = ct.trans_group_id
				
				left join (select bill.rollback_id, bill.prop_id
							from bill with (nolock)
							where bill.year = ' + convert(varchar(4), @tax_yr) + ') tmp on
					tmp.rollback_id = b.rollback_id
					and tmp.prop_id = b.prop_id
				
				--where no bills exist for the current year 
				where isNull(tmp.prop_id, -1) = -1
				--for active rollback bills that have a positive amount due
				and isNull(b.rollback_id, -1) > 0
				and ct.amount_due > 0
				and b.is_active = 1
				and b.year = ' + convert(varchar(4), @tax_yr) + '
				order by b.prop_id

	open rollbackData 
	
	fetch next from rollbackData into   @rollback_id, @prop_id, @effective_due_date,
										@owner_id, @payment_group_id, @tax_area_id, @sup_num,
										@tax_district_id, @levy_cd
	
	while @@fetch_status = 0
	begin
		set @base_tax_due = 0
		
		if(@currentPropID <> @prop_ID)
		begin
			set @currentPropID = @prop_ID
			exec GetNextStatementID ' + convert(varchar(4), @tax_yr) + ', @statement_id output, 0, 1
		end

		exec GetUniqueID ''trans_group'', @bill_id output, 1, 0
		-- create the trans_group record
		insert into trans_group (trans_group_id, trans_group_type) values (@bill_id, ''LB'')

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
			last_modified,
			created_by_type_cd,
			rollback_id,
			statement_id,
			payment_group_id
		)
		values
		(
			@bill_id,
			@prop_id,
			' + convert(varchar(4), @tax_yr) + ',
			@sup_num,
			@owner_id,
			0,
			@base_tax_due,
			0,
			@effective_due_date,
			''R'',
			1,
			getdate(),
			''SUP'',
			@rollback_id,
			@statement_id,
			@payment_group_id
		)

		-- create a levy_bill record
		insert into levy_bill
		(
			bill_id,
			levy_cd,
			[year],
			tax_district_id,
			taxable_val,
			tax_area_id
		)
		values
		(
			@bill_id,
			@levy_cd,
			' + convert(varchar(4), @tax_yr) + ',
			@tax_district_id,
			@taxable_val,
			@tax_area_id
		)

		-- get a new transaction_id
		exec GetUniqueID ''coll_transaction'', @transaction_id output, 1, 0

		-- create a pending_coll_transaction record
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
			''CLB'', 					-- transaction_type
			0,						-- underage_amount_pd
			0,						-- overage_amount_pd
			0,						-- other_amount_pd
			' + convert(varchar(10), @pacs_user_id) + ',
			getdate(),
			' + convert(varchar(10), @batch_id)+ '
		)
		
		--create an adjustment record
		exec GetUniqueID ''coll_transaction'', @transaction_id output, 1, 0
		
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
			''ADJLB'', 				-- transaction_type
			0,						-- underage_amount_pd
			0,						-- overage_amount_pd
			0,						-- other_amount_pd
			' + convert(varchar(10), @pacs_user_id) + ',
			getdate(),
			' + convert(varchar(10), @batch_id)+ '
		)

		exec GetUniqueID ''bill_adjustment'', @bill_adj_id output, 1, 0
		insert into bill_adjustment
		(
			bill_adj_id,
			bill_id,
			transaction_id,
			batch_id,
			sup_num,
			effective_due_dt,
			previous_taxable_val,
			taxable_val,
			bill_calc_type_cd,
			previous_base_tax,
			base_tax,
			tax_area_id,
			modify_reason
		)
		values
		(
			@bill_adj_id,
			@bill_id, 
			@transaction_id,
			' + convert(varchar(10), @batch_id)+ ',
			@sup_num,
			@effective_due_date,
			0,
			@taxable_val,
			''SM'',
			0,
			@base_tax_due,
			@tax_area_id,
			''TA-Generated bill for Rollback Statement''
		)	

		--This is required to view the bill
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
			0,
			@base_tax_due,
			0,
			@effective_due_date
		)

		fetch next from rollbackData into @rollback_id, @prop_id, @effective_due_date,
										@owner_id, @payment_group_id, @tax_area_id, @sup_num,
										@tax_district_id, @levy_cd
	end

close rollbackData
deallocate rollbackData'

exec (@sql)

GO

