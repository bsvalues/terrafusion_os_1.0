
CREATE PROCEDURE [dbo].[CreateSupplementVoidRollbackBills]
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
		@taxable_val			numeric(14, 0),
		@bill_id				int,
		@base_tax_due			numeric(14, 2),
		@transaction_id			int,
		@adjustment_amount		numeric(14,2),
		@bill_adj_id			int,
		@fee_id					int,
		@fee_adj_id				int,
		@rollback_id			int,
		@current_amount_due		numeric(14,2),
		@payment_count			int
			
	declare rollbackData cursor fast_forward for
	select distinct
				ar.ag_rollbk_id,
				ar.prop_id

				from ag_rollback as ar with (nolock)
					where isNull(ar.void_sup_group_id, -1) = @sup_group_id
					and isNull(ar.accept_sup_group_id, 0) <> isNull(ar.void_sup_group_id, 0)

	set nocount on
	open rollbackData 
	fetch next from rollbackData into @rollback_id, @prop_id
	
	while @@fetch_status = 0
	begin			
		--void bills
		declare billData cursor fast_forward for
		select distinct
					b.bill_id,
					b.year,
					b.current_amount_due,
					isNull([dbo].[fn_GetPropMaxAcceptedSupplement](@prop_id, b.[year]), 0)
					
					from bill as b with(nolock)
					where isNull(rollback_id, -1) = @rollback_id
						and b.prop_id = @prop_id

		open billData
		fetch next from billData into
			@bill_id, @tax_yr, @current_amount_due, @sup_num
		
		while @@fetch_status = 0
		begin
							
			--determine the adjustment amount
			set @adjustment_amount = 0 - @current_amount_due
			
			--get a new transaction_id
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
				@adjustment_amount,
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
				
			--get a new bill_adj_id
			exec GetUniqueID 'bill_adjustment', @bill_adj_id output, 1, 0
				
			insert into bill_adjustment
			(
				bill_adj_id,
				bill_id,
				transaction_id,
				batch_id,
				sup_num,
				previous_bill_fee_cd,
				bill_fee_cd,
				previous_effective_due_dt,
				effective_due_dt,
				previous_taxable_val,
				taxable_val,
				bill_calc_type_cd,
				previous_base_tax,
				base_tax,
				tax_area_id
			)
			select	@bill_adj_id, @bill_id, @transaction_id, @batch_id,
					@sup_num, b.code, b.code, b.effective_due_date, '', 
					lb.taxable_val, 0, 'SM', b.current_amount_due, 0,
					dbo.fn_BillLastTaxAreaId(b.bill_id,null) as tax_area_id
			from bill as b with (nolock)
			join levy_bill as lb with (nolock)
				on lb.bill_id = b.bill_id
			where b.bill_id = @bill_id					

			update bill set
				current_amount_due = 0,
				sup_num = @sup_num,
				last_modified = getdate()
			where 
				bill_id = @bill_id

			update levy_bill 
				set taxable_val = 0
				where bill_id = @bill_id
				
			update bill_payments_due set
				amount_due = 0
			where 
				bill_id = @bill_id

			fetch next from billData into
				@bill_id, @tax_yr, @current_amount_due, @sup_num

		end
		close billData
		deallocate billData 
		
		--void fees
		declare feeData cursor fast_forward for
		select distinct
					f.fee_id,
					f.year,
					f.current_amount_due,
					isNull(psa.sup_num,0)
					
					from fee as f with(nolock)
					join fee_prop_assoc fpa
						on fpa.fee_id = f.fee_id
					left join prop_supp_assoc as psa with (nolock)
						on psa.prop_id = fpa.prop_id
						and psa.owner_tax_yr = f.year
					
					where isNull(f.rollback_id, -1) = @rollback_id

		open feeData
		fetch next from feeData into @fee_id, @tax_yr, @current_amount_due, @sup_num
		
		while @@fetch_status = 0
		begin				
			--determine the adjustment amount
			set @adjustment_amount = 0 - @current_amount_due
		
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
				@fee_id,
				@adjustment_amount,
				0,						-- base_amount_pd
				0,						-- penalty_amount_pd
				0,						-- interest_amount_pd
				0,						-- bond_interest_pd
				'ADJF', 					-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate(),
				@batch_id
			)
	
			--insert into fee_adjustment
			exec GetUniqueID 'fee_adjustment', @fee_adj_id output, 1, 0

			insert into fee_adjustment
			(
				fee_adj_id,
				fee_id,
				transaction_id,
				batch_id,
				sup_num,
				previous_bill_fee_cd,
				bill_fee_cd,
				previous_effective_due_dt,
				effective_due_dt,
				bill_calc_type_cd,
				previous_base_amount,
				base_amount
			)
			select 
				@fee_adj_id,
				@fee_id,
				@transaction_id,
				@batch_id,
				@sup_num,
				f.code,
				f.code,
				f.effective_due_date,
				'',
				'SM',
				f.current_amount_due,
				0
			from fee f with (nolock)
			where f.fee_id = @fee_id
			and f.[year] = @tax_yr

			update fee
			set current_amount_due = 0,
			sup_num = @sup_num,
			last_modified = getdate()
			where fee_id = @fee_id
			and [year] = @tax_yr
			
			update fee_payments_due
			set amount_due = 0
			where fee_id = @fee_id

			fetch next from feeData into @fee_id, @tax_yr, @current_amount_due, @sup_num
		end
		close feeData
		deallocate feeData 
		
		--update ag_rollback
		update ag_rollback
		set bills_created = 'V'
		where ag_rollbk_id = @rollback_id
		

		fetch next from rollbackData into @rollback_id, @prop_id
	end 
	close rollbackData
	deallocate rollbackData

GO

