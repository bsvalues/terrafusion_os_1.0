


create procedure GetRefundDiscountUnderageOverageAmt
	@input_bill_id int,
	@input_base_mno_refund numeric(14,2),
	@input_base_ins_refund numeric(14,2),
	@output_discount_mno_amt numeric(14,2) output,
	@output_discount_ins_amt numeric(14,2) output,
	@output_underage_mno_amt numeric(14,2) output,
	@output_underage_ins_amt numeric(14,2) output,
	@output_overage_mno_amt numeric(14,2) output,
	@output_overage_ins_amt numeric(14,2) output

as

set @output_discount_mno_amt = 0.0
set @output_discount_ins_amt = 0.0
set @output_underage_mno_amt = 0.0
set @output_underage_ins_amt = 0.0
set @output_overage_mno_amt = 0.0
set @output_overage_ins_amt = 0.0


declare @bill_discount_mno_pd numeric(14,2)
declare @bill_discount_ins_pd numeric(14,2)
declare @bill_underage_mno_pd numeric(14,2)
declare @bill_underage_ins_pd numeric(14,2)
declare @bill_overage_mno_pd numeric(14,2)
declare @bill_overage_ins_pd numeric(14,2)

set @bill_discount_mno_pd = 0.0
set @bill_discount_ins_pd = 0.0
set @bill_underage_mno_pd = 0.0
set @bill_underage_ins_pd = 0.0
set @bill_overage_mno_pd = 0.0
set @bill_overage_ins_pd = 0.0


if exists
(
	select
		*
	from
		payment_trans with (nolock)
	where
		bill_id = @input_bill_id
	and	(mno_due + ins_due) > 0
)
begin
	select
		@bill_discount_mno_pd = discount_mno_pd,
		@bill_discount_ins_pd = discount_ins_pd,
		@bill_underage_mno_pd = underage_mno_pd,
		@bill_underage_ins_pd = underage_ins_pd,
		@bill_overage_mno_pd = overage_mno_pd,
		@bill_overage_ins_pd = overage_ins_pd
	from
		bill with (nolock)
	where
		bill_id = @input_bill_id


	declare @trans_mno_amt numeric(14,2)
	declare @trans_ins_amt numeric(14,2)
	declare	@trans_discount_amt numeric(14,2)
	declare @trans_underage_mno_amt numeric(14,2)
	declare @trans_underage_ins_amt numeric(14,2)
	declare @trans_overage_mno_amt numeric(14,2)
	declare @trans_overage_ins_amt numeric(14,2)
	

	declare PAYMENT cursor forward_only
	for
	select
		(mno_amt + discount_mno_amt + underage_mno_amt),
		(ins_amt + discount_ins_amt + underage_ins_amt),
		(discount_mno_amt + discount_ins_amt),
		underage_mno_amt,
		underage_ins_amt,
		overage_mno_amt,
		overage_ins_amt
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
		@trans_discount_amt,
		@trans_underage_mno_amt,
		@trans_underage_ins_amt,
		@trans_overage_mno_amt,
		@trans_overage_ins_amt
	
	while (@@fetch_status = 0)
	begin
		if ((@input_base_mno_refund + @input_base_ins_refund) > 0.0)
		begin
			declare @discount_rate numeric(5,2)

			if ((@trans_mno_amt + @trans_ins_amt) > 0.0)
			begin
				set @discount_rate = (@trans_discount_amt / (@trans_mno_amt + @trans_ins_amt))
			end
			else
			begin
				set @discount_rate = 0.0
			end
	
			if (@trans_mno_amt > @input_base_mno_refund)
			begin
				set @trans_mno_amt = @input_base_mno_refund
			end
		
			if (@trans_ins_amt > @input_base_ins_refund)
			begin
				set @trans_ins_amt = @input_base_ins_refund
			end

			set @output_discount_mno_amt = (@output_discount_mno_amt + (@trans_mno_amt * @discount_rate))
			set @output_discount_ins_amt = (@output_discount_ins_amt + (@trans_ins_amt * @discount_rate))
			set @output_underage_mno_amt = (@output_underage_mno_amt + @trans_underage_mno_amt)
			set @output_underage_ins_amt = (@output_underage_ins_amt + @trans_underage_ins_amt)
			set @output_overage_mno_amt = (@output_overage_mno_amt + @trans_overage_mno_amt)
			set @output_overage_ins_amt = (@output_overage_ins_amt + @trans_overage_ins_amt)
			
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
			@trans_discount_amt,
			@trans_underage_mno_amt,
			@trans_underage_ins_amt,
			@trans_overage_mno_amt,
			@trans_overage_ins_amt
	end


	close PAYMENT
	deallocate PAYMENT


	if (@output_discount_mno_amt > @bill_discount_mno_pd)
	begin
		set @output_discount_mno_amt = @bill_discount_mno_pd
	end

	if (@output_discount_ins_amt > @bill_discount_ins_pd)
	begin
		set @output_discount_ins_amt = @bill_discount_ins_pd
	end

	if (@output_underage_mno_amt > @bill_underage_mno_pd)
	begin
		set @output_underage_mno_amt = @bill_underage_mno_pd
	end

	if (@output_underage_ins_amt > @bill_underage_ins_pd)
	begin
		set @output_underage_ins_amt = @bill_underage_ins_pd
	end

	if (@output_overage_mno_amt > @bill_overage_mno_pd)
	begin
		set @output_overage_mno_amt = @bill_overage_mno_pd
	end

	if (@output_overage_ins_amt > @bill_overage_ins_pd)
	begin
		set @output_overage_ins_amt = @bill_overage_ins_pd
	end
end

GO

