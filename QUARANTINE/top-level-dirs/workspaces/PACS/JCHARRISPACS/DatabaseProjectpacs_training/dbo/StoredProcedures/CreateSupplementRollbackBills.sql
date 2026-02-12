
CREATE PROCEDURE [dbo].[CreateSupplementRollbackBills]
	@pacs_user_id		int,
	@sup_group_id	int	= 0,
	@batch_id int = 0
AS
	set nocount on

	-- declare variables and a curose to process each property and create its bills.
	declare 
		@tax_yr					int,
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
		@fee_id					int,
		@recording_fee_type_cd	varchar(10),
		@recording_fee_amount	numeric(14,2),
		@rollback_id			int,
		@penalty_fee_amount		numeric(14,2),
		@penalty_fee_type_cd	varchar(10),
		@classification			varchar(20),
		@effective_due_date datetime,
		@statement_id			int,
		@currentStmtYear		int,
		@payment_group_id		int,
		@tax_area_id			int,
		@current_rollback_id	int,
		@interest_fee_amount	numeric(14,2),
		@interest_fee_type_cd	varchar(10),
		@interest_fee_created	bit,
		@remainder_year_taxes	bit,
		@current_tax_yr			numeric(4, 0),
		@bill_fee_code			varchar(10),
		@levy_statement_id		int,
		@levy_payment_group_id	int,
		@levy_statement_due_date datetime,
		@stmt_h1_paid			bit,
		@ignoreOct30			bit,
		@ag_rollbk_type		varchar(10)
		
	--Determine the system's fee types
	select @penalty_fee_type_cd = szConfigValue
	from pacs_config
	where szGroup = 'RollbackFees'	
	and szConfigName = 'Penalty'

	select @recording_fee_type_cd = szConfigValue
	from pacs_config
	where szGroup = 'RollbackFees'	
	and szConfigName = 'Recording'

	set @interest_fee_type_cd = 'RbkTaxInt'
	set @interest_fee_created = 0

	select @current_tax_yr = tax_yr
	from pacs_system
	
	select @ignoreOct30 = isNull(cast(szConfigValue as bit), 0)
	from pacs_config
	where szGroup = 'SupplementDueDate'	
	and szConfigName = 'Ignore Oct 31'
	
	--	To be added
--	select @recording_fee_type_cd = szConfigValue
--	from pacs_config
--	where szGroup = 'RollbackFees'	
--	and szConfigName = 'Interest'

	--add 30 days to the current day and go to the last day of that month
	set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
	set @payment_group_id = 0
	set @current_rollback_id = -1
	
	declare rollbackData cursor fast_forward for
	select distinct
				ar.ag_rollbk_id, 
				isNull(war.penalty, 0), 
				isNull(war.recording_fee, 0), 
				ar.prop_id, 
				ar.owner_id,
				war.classification,
				war.tax_year,
				psa.sup_num,
				ar.ag_rollbk_type

				from ag_rollback as ar with (nolock)
				inner join wash_ag_rollback as war with (nolock)
					on war.ag_rollbk_id = ar.ag_rollbk_id
				
				join prop_accepted_supp_assoc_vw psa
					on psa.prop_id = ar.prop_id
					and psa.owner_tax_yr = war.tax_year

				left join levy_cert_run lcr with(nolock)
					on lcr.year = psa.owner_tax_yr	
				
				where isNull(accept_sup_group_id, -1) = @sup_group_id
				and isNull(ar.accept_sup_group_id, 0) <> isNull(ar.void_sup_group_id, 0)
				and IsNull(lcr.status,'') = 'Bills Activated'
				order by ar.ag_rollbk_id

	set nocount on
	open rollbackData 
	fetch next from rollbackData into 
		@rollback_id, @penalty_fee_amount, @recording_fee_amount, @prop_id, @owner_id, 
		@classification, @tax_yr, @sup_num, @ag_rollbk_type
	
	while @@fetch_status = 0
	begin
		if(@current_rollback_id <> @rollback_id)
		begin
			exec GetUniqueID 'payment_group_id', @payment_group_id output, 1, 0
			set @current_rollback_id = @rollback_id
			set @interest_fee_created = 0
			set @levy_statement_id = NULL
			set @levy_payment_group_id = NULL
		end		

		set @currentStmtYear = @tax_yr	
		exec GetNextStatementID @currentStmtYear, @statement_id output, 0, 1

		--create penalty fee
		
		-- under no circumstances should there be a penalty for DFL removal according to Clark. Bug 18544.
		if (@penalty_fee_amount > 0 and @ag_rollbk_type <> 'DFL')
		begin
			exec CreatePropOrBillFee		0, @pacs_user_id, @tax_yr, @batch_id, @prop_id, 0, @sup_num, @owner_id, 
											@penalty_fee_amount, @penalty_fee_type_cd, @effective_due_date,
											@statement_id, 'SM', 0, 'Rollback Penalty Fee', NULL, 'Rollback Bill', 'RbkCY', 
											@rollback_id, @payment_group_id
		end
		
		
		--recording fee
		if (@recording_fee_amount > 0)
		begin
			exec CreatePropOrBillFee		0, @pacs_user_id, @tax_yr, @batch_id, @prop_id, 0, @sup_num, @owner_id, 
											@recording_fee_amount, @recording_fee_type_cd, @effective_due_date,
											@statement_id, 'SM', 0, 'Rollback Recording Fee', NULL, 'Rollback Bill', NULL, 
											@rollback_id, @payment_group_id
		end
	
----------create bills------------------------------------------------------------------------------------------------------------
		declare billData cursor fast_forward for
		select distinct
					wla.year,
					isNull(psa.sup_num, 0),
					wla.tax_district_id,
					wla.levy_cd,
					isNull(sum(wla.base_tax_amt), 0) as base_tax_due,
					case when wos.tax_area_id is null
						then wdr.tax_area_id
						else wos.tax_area_id
					end as tax_area_id,
					case when isNull(wos.year_type, wdr.year_type) = 'R' 
						then 1
						else 0
					end as remainder_year_taxes
					
					from wash_ag_rollback_levy_assoc as wla with(nolock)
					
					left join wash_open_space_rollback as wos with(nolock)
						on wos.ag_rollbk_id = wla.ag_rollbk_id
						and wos.year = wla.year
						and wos.senior = wla.senior
						and wos.year_type = wla.year_type
					
					left join wash_dfl_rollback as wdr with(nolock)
						on wdr.ag_rollbk_id = wla.ag_rollbk_id
						and wdr.senior = wla.senior
						and wdr.year_type = wla.year_type
					
					left join prop_accepted_supp_assoc_vw psa
						on psa.prop_id = @prop_id
						and psa.owner_tax_yr = wla.[year]
						
					where wla.ag_rollbk_id = @rollback_id
						and isNull(wla.base_tax_amt, 0) > 0
					group by wla.[year], isNull(psa.sup_num, 0),
					wla.tax_district_id, wla.levy_cd, wos.tax_area_id, wdr.tax_area_id,
					case when isNull(wos.year_type, wdr.year_type) = 'R' 
						then 1 else 0 end
					order by wla.[year] desc

		open billData
		fetch next from billData into
			@tax_yr, @sup_num, @tax_district_id, @levy_cd, @base_tax_due, @tax_area_id, @remainder_year_taxes
		
		while @@fetch_status = 0 
		begin	
			if(@tax_yr <> @currentStmtYear)
			begin
				set @currentStmtYear = @tax_yr	
				exec GetNextStatementID @currentStmtYear, @statement_id output, 0, 1
				set @interest_fee_created = 0
				set @levy_statement_id = NULL
				set @levy_payment_group_id = NULL
				set @stmt_h1_paid = 0
				set @levy_statement_due_date = null
			end
			
			set @bill_fee_code = NULL

			--effective due date rules
			if @remainder_year_taxes = 0 
			begin
				set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
			
				if (@current_tax_yr = @tax_yr)
					set @bill_fee_code = 'RbkCY'
			
				else set @bill_fee_code = NULL
			end
			else
			begin
				--add 30 days to the current day and go to the last day of that month
				set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
				
				--If 4/30 is greater than the calculated date, then use 4/30
				if datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), @effective_due_date) <= 0
				begin
					set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), 0)
				end
				
				----Else If 4/30 is less than the calculated date, then if 10/31 is greater than the calculated date, then use 10/31
				else if @ignoreOct30 = 0 and datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), @effective_due_date) <= 0
				begin
					set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), 0)
				end

				--determine the levy statement id and payment group id if it hasn't already
				if @current_tax_yr = @tax_yr 
					and isNull(@levy_statement_id, 0) <= 0
					and isNull((	select count(distinct statement_id) 
									from bill with (nolock)
									join levy_bill lb with (nolock) on
										bill.bill_id = lb.bill_id
									where bill.year = @tax_yr
										and bill_type not in ('MCSA', 'MCSL', 'R', 'MCL', 'MCA')
										and bill.prop_id = @prop_id
										and isNull(bill.statement_id, 0) <> 0), 0) = 1
				begin
					select	@levy_statement_id = statement_id,
							@levy_payment_group_id = payment_group_id,
							@levy_statement_due_date = effective_due_date
					from bill with (nolock)
					join levy_bill lb with (nolock) on
						bill.bill_id = lb.bill_id
					where bill.year = @tax_yr
						and bill.prop_id = @prop_id
						and isNull(bill.statement_id, 0) <> 0
						and bill.bill_type not in ('MCSA', 'MCSL', 'R', 'MCL', 'MCA')
						
					if exists (	select * 
								from supplement_idlist 
								where statement_id = @levy_statement_id
								and prop_id = @prop_id
								and year = @tax_yr)
					begin
						select  @levy_statement_due_date = effective_due_date,
								@stmt_h1_paid = h1_paid
								from supplement_idlist 
								where statement_id = @levy_statement_id
								and prop_id = @prop_id
								and year = @tax_yr
					end
					else if isNull(@levy_statement_id, 0) > 0
					begin
						insert into supplement_idlist
						select @sup_group_id, year, prop_id, statement_id, max(effective_due_date), 0, 0
						from (
								select b.year, b.prop_id, statement_id, b.effective_due_date
								from bill b with (nolock)
								where b.year = @tax_yr 
								and b.prop_id = @prop_id
								and isNull(b.statement_id, 0) = @levy_statement_id

								union all

								select f.year, fpv.prop_id, statement_id, f.effective_due_date
								from fee f with (nolock)
								join fee_property_vw fpv with (nolock)
								on f.fee_id = fpv.fee_id
								where f.year = @tax_yr 
								and fpv.prop_id = @prop_id
								and isNull(f.statement_id, 0) = @levy_statement_id
						) tmp 
						group by year, prop_id, statement_id	
						
						update supplement_idlist
						set h1_paid = case 
										when (isNull(b.totalDue, 0) + isNull(f.totalDue, 0) > 0) and
										isNull(b.due, 0) = 0 and isNull(f.due, 0) = 0 then 1 else 0 end
						from supplement_idlist stmt
						left join (	select year, prop_id, statement_id, sum(current_amount_due) totalDue,
								sum(bpd.amount_paid - bpd.amount_due) due 
								from bill with (nolock)
								join bill_payments_due bpd with (nolock) on bpd.bill_id = bill.bill_id
								and bpd.bill_payment_id = 0
								group by year, prop_id, statement_id) b on b.year = stmt.year
						and b.prop_id = stmt.prop_id and b.statement_id = stmt.statement_id

						left join (	select fee.year, prop_id, statement_id, sum(current_amount_due) totalDue,
								sum(fpd.amount_paid - fpd.amount_due) due 
								from fee with (nolock)
								join fee_property_vw fpv with (nolock) on fpv.fee_id = fee.fee_id
								join fee_payments_due fpd with (nolock) on fpd.fee_id = fee.fee_id
								and fpd.fee_payment_id = 0
								group by fee.year, prop_id, statement_id) f on f.year = stmt.year
						and f.prop_id = stmt.prop_id and f.statement_id = stmt.statement_id
						where stmt.sup_group_id = @sup_group_id

						select	@stmt_h1_paid = h1_paid, 
								@levy_statement_due_date = effective_due_date 
						from supplement_idlist
						where sup_group_id = @sup_group_id
						and year = @tax_yr
						and prop_id = @prop_id
						and statement_id = @levy_statement_id	
						
						if(@levy_statement_due_date > @effective_due_date)
						begin
							update supplement_idlist
							set effective_due_date = @effective_due_date,
							updated = 1
							where year = @tax_yr
							and prop_id = @prop_id
							and statement_id = @levy_statement_id
							and sup_group_id = @sup_group_id
							
							set @levy_statement_due_date = @effective_due_date
						end
					end
				end
			end

			if (@levy_statement_due_date < @effective_due_date and @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr) begin
				set @levy_statement_due_date = @effective_due_date				
			end
			
			exec GetUniqueID 'trans_group', @bill_id output, 1, 0
			-- create the trans_group record
			insert into trans_group (trans_group_id, trans_group_type) values (@bill_id, 'LB')

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
				payment_group_id,
				code
			)
			values
			(
				@bill_id,
				@prop_id,
				@tax_yr,
				@sup_num,
				@owner_id,
				0,
				@base_tax_due,
				0,
				case when @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr
					then @levy_statement_due_date
					else @effective_due_date end,
				case when @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr
					then 'RR' 
					else 'R' end,
				0,
				getdate(),
				'SUP',
				@rollback_id,
				case when @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr --and isNull(@statement_id, 0) > 0 --the statement group assignment process should handle this
					then @levy_statement_id
					else @statement_id end,
				case when @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr --and isNull(@statement_id, 0) > 0 --the statement group assignment process should handle this
					then @levy_payment_group_id
					else @payment_group_id end,
				@bill_fee_code
			)

			--set taxable_val
			select @taxable_val = max(taxable_val)
			from wash_ag_rollback_levy_assoc
			where ag_rollbk_id = @rollback_id
				and [year] = @tax_yr
				and tax_district_id = @tax_district_id
				and levy_cd = @levy_cd

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
				@tax_yr,
				@tax_district_id,
				@taxable_val,
				@tax_area_id
			)

			-- get a new transaction_id
			exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0

			-- create a pending_coll_transaction record
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
				'CLB', 					-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate(),
				@batch_id
			)
			
			--create an adjustment record
			exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0
			
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
				'ADJLB', 				-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate(),
				@batch_id
			)
	
			exec GetUniqueID 'bill_adjustment', @bill_adj_id output, 1, 0
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
				tax_area_id
			)
			values
			(
				@bill_adj_id,
				@bill_id, 
				@transaction_id,
				@batch_id,
				@sup_num,
				case when @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr
					then @levy_statement_due_date
					else @effective_due_date end,
				0,
				@taxable_val,
				'SM',
				0,
				@base_tax_due,
				@tax_area_id
			)	


			--supplement_idlist
			if (@remainder_year_taxes = 1 and @current_tax_yr = @tax_yr 
				and isNull(@stmt_h1_paid, 0) = 1)
			begin
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
					0,
					0,
					@levy_statement_due_date
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
					1,
					@base_tax_due,
					0,
					@levy_statement_due_date
				)
			end
			else
			begin
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
					case when @remainder_year_taxes = 1 and @current_tax_yr = @tax_yr 
						then @levy_statement_due_date
						else @effective_due_date end
				)
			end

			--create interest tax fees
			if (@interest_fee_created = 0)
			begin
				
				set @interest_fee_amount = 0

				select @interest_fee_amount = tmp.interestDue
				from wash_ag_rollback war with (nolock)
				join (	select sum(interest_due) interestDue, year, ag_rollbk_id
						from wash_open_space_rollback with (nolock)
						group by year, ag_rollbk_id ) tmp 
				on tmp.ag_rollbk_id = war.ag_rollbk_id
				and tmp.year = @tax_yr
				where war.ag_rollbk_id = @rollback_id

				if (@current_tax_yr = @tax_yr)
					set @bill_fee_code = 'RbkCY'

				if (@interest_fee_amount > 0)
				begin
					exec CreatePropOrBillFee		0, @pacs_user_id, @tax_yr, @batch_id, @prop_id, 0, @sup_num, @owner_id, 
													@interest_fee_amount, @interest_fee_type_cd, @effective_due_date,
													@statement_id, 'SM', 0, 'Rollback Interest Fee', NULL, 'Rollback Bill', @bill_fee_code, 
													@rollback_id, @payment_group_id
				end
				
				set @interest_fee_created = 1
			end			


			fetch next from billData into
				@tax_yr, @sup_num, @tax_district_id, @levy_cd, @base_tax_due, @tax_area_id, @remainder_year_taxes

		end
		close billData
		deallocate billData 
	
	--update ag_rollback
	update ag_rollback
	set bills_created = 'T'
	where ag_rollbk_id = @rollback_id

	fetch next from rollbackData into 
		@rollback_id, @penalty_fee_amount, @recording_fee_amount, @prop_id, @owner_id, 
		@classification, @tax_yr, @sup_num, @ag_rollbk_type
	end 
	close rollbackData
	deallocate rollbackData
	
	if exists (select * from supplement_idlist where updated = 1 and sup_group_id = @sup_group_id)
	begin
		--update bill and statement items where the effective date was updated
		update b
		set effective_due_date = stmt.effective_due_date
		from bill b with (nolock)
		join supplement_idlist stmt with (nolock) on stmt.year = b.year
		and stmt.prop_id = b.prop_id
		and stmt.statement_id = b.statement_id
		where stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update bpd
		set due_date = stmt.effective_due_date
		from bill_payments_due bpd with (nolock) 
		join bill b with (nolock) on b.bill_id = bpd.bill_id
		join supplement_idlist stmt with (nolock) on stmt.year = b.year
		and stmt.prop_id = b.prop_id
		and stmt.statement_id = b.statement_id
		where bpd.bill_payment_id = 0
		and stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update f
		set effective_due_date = stmt.effective_due_date
		from fee f with (nolock)
		join fee_property_vw fpv with (nolock) on fpv.fee_id = f.fee_id
		join supplement_idlist stmt with (nolock) on stmt.year = f.year
		and stmt.prop_id = fpv.prop_id
		and stmt.statement_id = f.statement_id
		where stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update fpd
		set due_date = stmt.effective_due_date
		from fee_payments_due fpd with (nolock) 
		join fee f with (nolock) on f.fee_id = fpd.fee_id
		join fee_property_vw fpv with (nolock) on fpv.fee_id = f.fee_id
		join supplement_idlist stmt with (nolock) on stmt.year = f.year
		and stmt.prop_id = fpv.prop_id
		and stmt.statement_id = f.statement_id
		where fpd.fee_payment_id = 0
		and stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id
	end

GO

