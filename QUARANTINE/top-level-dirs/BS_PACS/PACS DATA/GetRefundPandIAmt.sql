


create procedure GetRefundPandIAmt
	@input_bill_id int,
	@input_base_mno_refund numeric(14,2),
	@input_base_ins_refund numeric(14,2),
	@output_penalty_mno_amt numeric(14,2) output,
	@output_penalty_ins_amt numeric(14,2) output,
	@output_interest_mno_amt numeric(14,2) output,
	@output_interest_ins_amt numeric(14,2) output,
	@output_atty_fee_amt numeric(14,2) output

as

set @output_penalty_mno_amt = 0.0
set @output_penalty_ins_amt = 0.0
set @output_interest_mno_amt = 0.0
set @output_interest_ins_amt = 0.0
set @output_atty_fee_amt = 0.0


declare @bill_penalty_mno_pd numeric(14,2)
declare @bill_penalty_ins_pd numeric(14,2)
declare @bill_interest_mno_pd numeric(14,2)
declare @bill_interest_ins_pd numeric(14,2)
declare @bill_attorney_fees_pd numeric(14,2)

set @bill_penalty_mno_pd = 0.0
set @bill_penalty_ins_pd = 0.0
set @bill_interest_mno_pd = 0.0
set @bill_interest_ins_pd = 0.0
set @bill_attorney_fees_pd = 0.0


if exists
(
	select
		*
	from
		payment_trans with (nolock)
	where
		bill_id = @input_bill_id
	and	(mno_due + ins_due) > 0.0
)
begin
	select
		@bill_penalty_mno_pd = penalty_m_n_o_pd,
		@bill_penalty_ins_pd = penalty_i_n_s_pd,
		@bill_interest_mno_pd = interest_m_n_o_pd,
		@bill_interest_ins_pd = interest_i_n_s_pd,
		@bill_attorney_fees_pd = attorney_fees_pd
	from
		bill with (nolock)
	where
		bill_id = @input_bill_id


	declare @trans_mno_amt numeric(14,2)
	declare @trans_ins_amt numeric(14,2)
	declare	@trans_penalty_amt numeric(14,2)
	declare	@trans_interest_amt numeric(14,2)
	declare	@trans_attorney_fee_amt numeric(14,2)


	declare PAYMENT cursor forward_only
	for
	select
		(mno_amt + discount_mno_amt + underage_mno_amt),
		(ins_amt + discount_ins_amt + underage_ins_amt),
		(penalty_mno_amt + penalty_ins_amt),
		(interest_mno_amt + interest_ins_amt),
		attorney_fee_amt
   	from 
		payment_trans with (nolock)
	where
		bill_id = @input_bill_id
	order by
		transaction_id desc
	 


	open PAYMENT
	fetch next from PAYMENT
	into
		@trans_mno_amt,
		@trans_ins_amt,
		@trans_penalty_amt,
		@trans_interest_amt,
		@trans_attorney_fee_amt
	
	while (@@fetch_status = 0)
	begin
		if ((@input_base_mno_refund + @input_base_ins_refund) > 0.0)
		begin
			declare @trans_penalty_rate numeric(5,2)
			declare @trans_interest_rate numeric(5,2)
			declare @trans_attorney_fee_rate numeric(5,2)

			if ((@trans_mno_amt + @trans_ins_amt) > 0.0)
			begin
				set @trans_penalty_rate = (@trans_penalty_amt) / (@trans_mno_amt + @trans_ins_amt)
				set @trans_interest_rate = (@trans_interest_amt) / (@trans_mno_amt + @trans_ins_amt)
			end
			else
			begin
				set @trans_penalty_rate = 0.0
				set @trans_interest_rate = 0.0
			end
	
			if ((@trans_mno_amt + @trans_ins_amt + @trans_penalty_amt + @trans_interest_amt) > 0.0)
			begin
				set @trans_attorney_fee_rate = (@trans_attorney_fee_amt) / (@trans_mno_amt + @trans_ins_amt + @trans_penalty_amt + @trans_interest_amt)
			end
			else
			begin
				set @trans_attorney_fee_rate = 0.0
			end

			if (@trans_mno_amt > @input_base_mno_refund)
			begin
				set @trans_mno_amt = @input_base_mno_refund
			end
		
			if (@trans_ins_amt > @input_base_ins_refund)
			begin
				set @trans_ins_amt = @input_base_ins_refund
			end
				
			set @output_penalty_mno_amt = @output_penalty_mno_amt + (@trans_mno_amt * @trans_penalty_rate)
			set @output_interest_mno_amt = @output_interest_mno_amt + (@trans_mno_amt * @trans_interest_rate)
			set @output_penalty_ins_amt = @output_penalty_ins_amt + (@trans_ins_amt * @trans_penalty_rate)
			set @output_interest_ins_amt = @output_interest_ins_amt + (@trans_ins_amt * @trans_interest_rate)
			set @output_atty_fee_amt = @output_atty_fee_amt + ((@trans_mno_amt + @trans_ins_amt + @output_penalty_mno_amt + @output_penalty_ins_amt + @output_interest_mno_amt + @output_interest_ins_amt) * @trans_attorney_fee_rate)
			
			select @input_base_mno_refund = @input_base_mno_refund - @trans_mno_amt
			select @input_base_ins_refund = @input_base_ins_refund - @trans_ins_amt
		end
		else
		begin
			break;
		end

		fetch next from PAYMENT
		into
			@trans_mno_amt,
			@trans_ins_amt,
			@trans_penalty_amt,
			@trans_interest_amt,
			@trans_attorney_fee_amt
	end


	close PAYMENT
	deallocate PAYMENT


	if (@output_penalty_mno_amt > @bill_penalty_mno_pd)
	begin
		set @output_penalty_mno_amt = @bill_penalty_mno_pd
	end

	if (@output_penalty_ins_amt > @bill_penalty_ins_pd)
	begin
		set @output_penalty_ins_amt = @bill_penalty_ins_pd
	end

	if (@output_interest_mno_amt > @bill_interest_mno_pd)
	begin
		set @output_interest_mno_amt = @bill_interest_mno_pd
	end

	if (@output_interest_ins_amt > @bill_interest_ins_pd)
	begin
		set @output_interest_ins_amt = @bill_interest_ins_pd
	end

	if (@output_atty_fee_amt > @bill_attorney_fees_pd)
	begin
		set @output_atty_fee_amt = @bill_attorney_fees_pd
	end
end

GO

