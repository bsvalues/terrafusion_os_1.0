
CREATE PROCEDURE [dbo].[RefactorPaymentsDue]
	@id			int,
	@payments	int = 1

AS
	set nocount on
	declare 
		@return_message		varchar(255),
		@base_amount_due	numeric(14,2),
		@trans_group_type	varchar(10),
		@amount_paid		numeric(14,2),
		@pmt_amount			numeric(14,2),
		@pmts				int,
		@year				int,
		@current_tax_year	int,
		@payout_agreement_id	int,
		@payout_agreement_count	int,
		@payout_sched_id	int,
		@effective_due_date	datetime
	
	select @trans_group_type = trans_group_type 
	from trans_group with (nolock)
	where trans_group_id = @id

	select @current_tax_year = max(tax_yr)
	from pacs_year
	where isNull(certification_dt, '') = ''
	
	if @id < 0 or @payments <= 0 or (@trans_group_type not in ('AB','LB','F')) 
	begin 
		set @return_message = 'Invalid Id.'
		goto quit
	end
	
	select	@base_amount_due = sum(base_amount), 
			@amount_paid = sum(base_amount_pd) 
	from coll_transaction with (nolock)
	where trans_group_id = @id	
	
	set @pmt_amount = @base_amount_due / @payments
	set @pmts = @payments
	

	if @trans_group_type in ('AB', 'LB') --Bills
	begin
		select @year = [year], 
		@effective_due_date = isNull(effective_due_date, '')
		from bill
		where bill_id = @id	

		select @payout_agreement_id = isNull(payout_agreement_id, 0)
		from payout_agreement_bill_assoc
		where bill_id = @id
		
		select @payout_agreement_count = count(payout_agreement_schedule_id),
		@payout_sched_id = min(payout_agreement_schedule_id)
		from payout_agreement_schedule
		where @payout_agreement_id = @payout_agreement_id

		--Delete the existing records
		delete from bill_payments_due 
		where bill_id = @id
		
		--Insert the new records
		while @pmts > 0
		begin		
			insert into bill_payments_due
			(
				bill_id,
				bill_payment_id,
				amount_due,
				amount_paid
			)
			values
			(
				@id,
				@payments - @pmts,
				case when (@pmts > 1) 
					then @pmt_amount
					else (@base_amount_due - (@pmt_amount * (@payments - 1))) end,
				0
			)

			set @pmts = @pmts - 1
		end
		
		set @pmts = @payments
		while @pmts > 0 and @amount_paid > 0
		begin
			select @pmt_amount = case when (amount_due > @amount_paid) 
										then @amount_paid
										else amount_due end
			from bill_payments_due
			where bill_id = @id
			and bill_payment_id = @payments - @pmts
						

			update bill_payments_due
			set amount_paid = 
				case when (@pmts = 1) then @amount_paid else @pmt_amount end
			where bill_id = @id
			and bill_payment_id = @payments - @pmts
			
			set @amount_paid = @amount_paid - @pmt_amount
			set @pmts = @pmts - 1
		end

		if @payments = 2 and @year >= @current_tax_year
		begin
			update bill_payments_due
			set due_date = dbo.fn_FormatDate(dateadd(year, (@year-datepart(year, '2000/4/30')), '2000/4/30'), 0)
			where bill_payment_id = 0

			update bill_payments_due
			set due_date = dbo.fn_FormatDate(dateadd(year, (@year-datepart(year, '2000/10/31')), '2000/10/31'), 0)
			where bill_payment_id = 1
		end

		else if @payout_agreement_id > 0 and @payments = @payout_agreement_count
		begin
			while @payout_agreement_count > 0
			begin
				update bill_payments_due
				set due_date = (select s.due_date 
								from payout_agreement_schedule as s with (nolock)
								where payout_agreement_id = @payout_agreement_id
								and payout_agreement_schedule_id = @payout_sched_id)
				where bill_id = @id
				and bill_payment_id = @payments - @payout_agreement_count
				
				set @payout_sched_id = @payout_sched_id + 1
				set @payout_agreement_count = @payout_agreement_count - 1
			end
		end
		
		else
		begin
			set @pmts = @payments
			while @pmts > 0
			begin
				update bill_payments_due 
				set due_date = case when (bill_payment_id = 0) then @effective_due_date
									else dbo.[fn_GetLastDayOfMonth](dateadd(month, 2*(bill_payment_id), @effective_due_date)) end
				where bill_id = @id
				and bill_payment_id = @payments - @pmts
				set @pmts = @pmts - 1
			end
			
		end
			

	end

	else if @trans_group_type in ('F') --Fees
	begin
		select @year = [year], 
		@effective_due_date = isNull(effective_due_date, '')
		from fee
		where fee_id = @id	

		select @payout_agreement_id = isNull(payout_agreement_id, 0)
		from payout_agreement_fee_assoc
		where fee_id = @id
		
		select @payout_agreement_count = count(payout_agreement_schedule_id),
		@payout_sched_id = min(payout_agreement_schedule_id)
		from payout_agreement_schedule
		where @payout_agreement_id = @payout_agreement_id
	

		--Delete the existing records
		delete from fee_payments_due 
		where fee_id = @id
		
		--Insert the new records
		while @pmts > 0
		begin		
			insert into fee_payments_due
			(
				fee_id,
				fee_payment_id,
				year,
				amount_due,
				amount_paid
			)
			values
			(
				@id,
				@payments - @pmts,
				@year,
				case when (@pmts > 1) 
					then @pmt_amount
					else (@base_amount_due - (@pmt_amount * (@payments - 1))) end,
				0		
			)

			set @pmts = @pmts - 1
		end
		
		set @pmts = @payments
		while @pmts > 0 and @amount_paid > 0
		begin
			select @pmt_amount = case when (amount_due > @amount_paid) 
										then @amount_paid
										else amount_due end
			from fee_payments_due
			where fee_id = @id
			and fee_payment_id = @payments - @pmts
						

			update fee_payments_due
			set amount_paid = 
				case when (@pmts = 1) then @amount_paid else @pmt_amount end
			where fee_id = @id
			and fee_payment_id = @payments - @pmts
			
			set @amount_paid = @amount_paid - @pmt_amount
			set @pmts = @pmts - 1
		end

		if @payments = 2 and @year >= @current_tax_year
		begin
			update fee_payments_due
			set due_date = dbo.fn_FormatDate(dateadd(year, (@year-datepart(year, '2000/4/30')), '2000/4/30'), 0)
			where fee_payment_id = 0

			update fee_payments_due
			set due_date = dbo.fn_FormatDate(dateadd(year, (@year-datepart(year, '2000/10/31')), '2000/10/31'), 0)
			where fee_payment_id = 1
		end

		else if @payout_agreement_id > 0 and @payments = @payout_agreement_count
		begin
			while @payout_agreement_count > 0
			begin
				update fee_payments_due
				set due_date = (select s.due_date 
								from payout_agreement_schedule as s with (nolock)
								where payout_agreement_id = @payout_agreement_id
								and payout_agreement_schedule_id = @payout_sched_id)
				where fee_id = @id
				and fee_payment_id = @payments - @payout_agreement_count
				
				set @payout_sched_id = @payout_sched_id + 1
				set @payout_agreement_count = @payout_agreement_count - 1
			end
		end
		
		else
		begin
			set @pmts = @payments
			while @pmts > 0
			begin
				update fee_payments_due 
				set due_date = case when (fee_payment_id = 0) then @effective_due_date
									else dbo.[fn_GetLastDayOfMonth](dateadd(month, 2*(fee_payment_id), @effective_due_date)) end
				where fee_id = @id
				and fee_payment_id = @payments - @pmts
				set @pmts = @pmts - 1
			end
			
		end
					
	end

	
	
	
quit:
	select @return_message as return_message
	set nocount off

GO

