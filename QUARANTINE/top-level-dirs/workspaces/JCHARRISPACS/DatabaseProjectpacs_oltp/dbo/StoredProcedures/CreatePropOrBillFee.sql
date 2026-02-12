
CREATE PROCEDURE [dbo].[CreatePropOrBillFee]
	@fee_id				int,
	@pacs_user_id		int,
	@tax_yr				int,
	@batch_id			int = 0,
	@prop_id			int = 0,
	@bill_id			int = 0,
	@sup_num			int = 0,
	@owner_id			int,
	@base_amount_due	numeric(14,2),
	@fee_type_cd		varchar(10),
	@effective_due_date datetime = '',
	@statement_id		int = 0,
	@bill_calc_type_cd	varchar(10) = '',
	@fee_current_amount_due	numeric(14,2) = 0,
	@comment			varchar(500) = '',
	@modify_cd			varchar(10) = '',
	@modify_reason		varchar(500) = '',
	@bill_fee_cd		varchar(10) = null,
	@rollback_id		int = 0,
	@payment_group_id	int = 0,
	@accept_prop_id		int = 0,
	@supplementProcess	int = 1,  --0 indicates that this is not a supplement process
	@stmt_h1_paid		bit = 0
	
AS
	set nocount on
	declare 
		@transaction_id			int,
		@fee_adj_id				int,
		@fee_adjustment_amount	numeric(14,2)

	if isNull(@fee_id, 0) = 0
	begin
		exec GetUniqueID 'trans_group', @fee_id output, 1, 0
				
		insert into trans_group (trans_group_id, trans_group_type)
		values (@fee_id, 'F')
	
		insert into fee
		(
			fee_id,
			[year],
			sup_num, 
			fee_type_cd,
			owner_id,
			initial_amount_due,
			current_amount_due,
			amount_paid,
			effective_due_date,
			comment,
			fee_create_date,
			last_modified,
			statement_id,
			rollback_id,
			code,
			payment_group_id,
			is_active					
		)
		values
		(
			@fee_id,
			@tax_yr,
			@sup_num,
			@fee_type_cd,
			@owner_id,
			case when (isNull(@supplementProcess, 0) = 1) then 0 else @base_amount_due end,
			@base_amount_due,
			0,
			@effective_due_date,
			@comment,
			getdate(),
			getdate(),
			@statement_id,
			case when (isNull(@rollback_id, -1) = -1) then NULL else @rollback_id end,
			case when @bill_fee_cd <> '' then @bill_fee_cd else null end,
			@payment_group_id,
			case when @accept_prop_id > 0 then 1 else 0 end
		)

		if (@stmt_h1_paid = 1)
		begin
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
				@tax_yr,
				0,
				0,
				@effective_due_date
			)
			
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
				1,
				@tax_yr,
				@base_amount_due,
				0,
				@effective_due_date
			)		
		end
		else
		begin
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
				@tax_yr,
				@base_amount_due,
				0,
				@effective_due_date
			)
		end

		-- get a new transaction id for the 'Create Fee' transaction
		exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0

		-- create a coll_transaction record for the fee
		if @accept_prop_id > 0
		begin
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
				@fee_id,
				case when (isNull(@supplementProcess, 0) = 1) then 0 else @base_amount_due end,
				0,						-- base_amount_pd
				0,						-- penalty_amount_pd
				0,						-- interest_amount_pd
				0,						-- bond_interest_pd
				'CF', 					-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate(),
				@batch_id
			)
		end

		else
		begin
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
				case when (isNull(@supplementProcess, 0) = 1) then 0 else @base_amount_due end,
				0,						-- base_amount_pd
				0,						-- penalty_amount_pd
				0,						-- interest_amount_pd
				0,						-- bond_interest_pd
				'CF', 					-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate(),
				@batch_id
			)

		end

		if @bill_id > 0
		begin
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

		else if @prop_id > 0
		begin 
			insert into fee_prop_assoc
			(
				fee_id,
				prop_id
			)
			values 
			(
				@fee_id,
				@prop_id
			)
		end		
	
		--Rollback Fees
		if isNull(@supplementProcess , 0) = 1
		begin
			exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0
					
			-- create a coll_transaction record for the fee
			if @accept_prop_id > 0
			begin
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
					@fee_id,
					@base_amount_due,
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
			end

			else
			begin
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
					@base_amount_due,
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
			end

		
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
				base_amount,
				modify_cd,
				modify_reason
			)
			select 
				@fee_adj_id,
				@fee_id,
				@transaction_id,
				@batch_id,
				@sup_num,
				case when isNull(f.code, '') = '' then null else f.code end,
				case when isNull(@bill_fee_cd, '') = '' then 
						case when isNull(f.code, '') = '' then null else f.code end
					else null end,
				f.effective_due_date,
				@effective_due_date,
				@bill_calc_type_cd,
				0,
				@base_amount_due,
				@modify_cd,
				@modify_reason
			from fee f with (nolock)
			where f.fee_id = @fee_id
			and f.[year] = @tax_yr

		end

	end
	
	else if (@fee_id > 0) 	
	begin
		--if the fee is associated with a payout, set its status to locked.
		UPDATE payout_agreement
		SET status_cd = 'L'
		FROM payout_agreement pa with(nolock)
		INNER JOIN fee with(nolock)
			ON fee.payout_agreement_id = pa.payout_agreement_id
		WHERE fee.fee_id = @fee_id

		exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0
				
		-- create a coll_transaction record for the fee
		if @accept_prop_id > 0
		begin
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
				@fee_id,
				(@base_amount_due - @fee_current_amount_due),
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
		end

		else
		begin
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
				(@base_amount_due - @fee_current_amount_due),
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
		end

	
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
			base_amount,
			modify_cd,
			modify_reason
		)
		select 
			@fee_adj_id,
			@fee_id,
			@transaction_id,
			@batch_id,
			@sup_num,
			case when isNull(f.code, '') = '' then null else f.code end,
			case when isNull(@bill_fee_cd, '') = '' then 
					case when isNull(f.code, '') = '' then null else f.code end
				else null end,
			f.effective_due_date,
			@effective_due_date,
			@bill_calc_type_cd,
			f.current_amount_due,
			@base_amount_due,
			@modify_cd,
			@modify_reason
		from fee f with (nolock)
		where f.fee_id = @fee_id
		and f.[year] = @tax_yr

		--if we are in half pay and the amount was adjusted up
		if (select count(distinct fee_payment_id) 
						from fee_payments_due with (nolock)
						where fee_id = @fee_id
						and is_payout_payment = 0 ) = 2
			and @base_amount_due > (	select current_amount_due 
										from fee with (nolock) 
										where fee_id = @fee_id)
		begin
			update h2
					set amount_due = @base_amount_due - h1.amount_due
					from fee_payments_due h2 with (nolock)
					join fee_payments_due h1 with (nolock)
					on h2.fee_id = h1.fee_id 
					and h1.fee_payment_id = 0
					where h2.fee_id = @bill_id
					and h2.fee_payment_id = 1						
		end
		else
		begin
			delete from fee_payments_due
			where fee_id = @fee_id

			--This is required to view the fee
			insert into fee_payments_due 
			(
				fee_id,
				fee_payment_id,
				[year],
				amount_due,
				amount_paid,
				due_date		
			)
			select 
				@fee_id,
				0, 
				[year],
				@base_amount_due, 
				amount_paid, 
				@effective_due_date
			from fee
				where fee_id = @fee_id
		end

		update fee
		set current_amount_due = @base_amount_due,
		sup_num = @sup_num,
		effective_due_date = @effective_due_date,
		last_modified = getdate(),
		payment_status_type_cd = case when payment_status_type_cd = 'Payout' 
																	then payment_status_type_cd
																	else 'FULL' end
		where fee_id = @fee_id
		and [year] = @tax_yr
	end

GO

