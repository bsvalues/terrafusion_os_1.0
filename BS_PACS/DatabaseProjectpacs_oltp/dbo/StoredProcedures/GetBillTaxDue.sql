


create procedure GetBillTaxDue
	@input_bill_id int,
	@input_show_output int,
	@input_delq_roll char(1),
	@input_effective_date varchar(100),

	@output_str_base_tax varchar(100) output,
	@output_str_penalty_mno varchar(100) output,
	@output_str_penalty_ins varchar(100) output,
	@output_str_interest_mno varchar(100) output,
	@output_str_interest_ins varchar(100) output,
	@output_str_attorney_fee varchar(100) output,
	@output_total varchar(100) output,

	@output_pay1_due varchar(100) = '0' output,
	@output_pay1_base_tax varchar(100) = '0' output,
	@output_pay1_penalty_mno varchar(100) = '0' output,
	@output_pay1_penalty_ins varchar(100) = '0' output,
	@output_pay1_interest_mno varchar(100) = '0' output,
	@output_pay1_interest_ins varchar(100) = '0' output,
	@output_pay1_attorney_fee varchar(100) = '0' output,

	@output_pay2_due varchar(100) = '0' output,
	@output_pay2_base_tax varchar(100) = '0' output,
	@output_pay2_penalty_mno varchar(100) = '0' output,
	@output_pay2_penalty_ins varchar(100) = '0' output,
	@output_pay2_interest_mno varchar(100) = '0' output,
	@output_pay2_interest_ins varchar(100) = '0' output,
	@output_pay2_attorney_fee varchar(100) = '0' output,

	@output_pay3_due varchar(100) = '0' output,
	@output_pay3_base_tax varchar(100) = '0' output,
	@output_pay3_penalty_mno varchar(100) = '0' output,
	@output_pay3_penalty_ins varchar(100) = '0' output,
	@output_pay3_interest_mno varchar(100) = '0' output,
	@output_pay3_interest_ins varchar(100) = '0' output,
	@output_pay3_attorney_fee varchar(100) = '0' output,

	@output_pay4_due varchar(100) = '0' output,
	@output_pay4_base_tax varchar(100) = '0' output,
	@output_pay4_penalty_mno varchar(100) = '0' output,
	@output_pay4_penalty_ins varchar(100) = '0' output,
	@output_pay4_interest_mno varchar(100) = '0' output,
	@output_pay4_interest_ins varchar(100) = '0' output,
	@output_pay4_attorney_fee varchar(100) = '0' output,

	@output_m_n_o_due varchar(100) = '0' output,
	@output_i_n_s_due varchar(100) = '0' output,

	@output_str_discount_mno varchar(100) = '0' output,
	@output_str_discount_ins varchar(100) = '0' output,
	@output_str_underage_mno varchar(100) = '0' output,
	@output_str_underage_ins varchar(100) = '0' output,
	@output_str_overage_mno varchar(100) = '0' output,
	@output_str_overage_ins varchar(100) = '0' output
as 

set @output_str_base_tax = '0'
set @output_str_penalty_mno = '0'
set @output_str_penalty_ins = '0'
set @output_str_interest_mno = '0'
set @output_str_interest_ins = '0'
set @output_str_attorney_fee = '0'
set @output_total = '0'

set @output_pay1_due = '0'
set @output_pay1_base_tax = '0'
set @output_pay1_penalty_mno = '0'
set @output_pay1_penalty_ins = '0'
set @output_pay1_interest_mno = '0'
set @output_pay1_interest_ins = '0'
set @output_pay1_attorney_fee = '0'

set @output_pay2_due = '0'
set @output_pay2_base_tax = '0'
set @output_pay2_penalty_mno = '0'
set @output_pay2_penalty_ins = '0'
set @output_pay2_interest_mno = '0'
set @output_pay2_interest_ins = '0'
set @output_pay2_attorney_fee = '0'

set @output_pay3_due = '0'
set @output_pay3_base_tax = '0'
set @output_pay3_penalty_mno = '0'
set @output_pay3_penalty_ins = '0'
set @output_pay3_interest_mno = '0'
set @output_pay3_interest_ins = '0'
set @output_pay3_attorney_fee = '0'

set @output_pay4_due = '0'
set @output_pay4_base_tax = '0'
set @output_pay4_penalty_mno = '0'
set @output_pay4_penalty_ins = '0'
set @output_pay4_interest_mno = '0'
set @output_pay4_interest_ins = '0'
set @output_pay4_attorney_fee = '0'

set @output_m_n_o_due = '0'
set @output_i_n_s_due = '0'

set @output_str_discount_mno = '0'
set @output_str_discount_ins = '0'
set @output_str_underage_mno = '0'
set @output_str_underage_ins = '0'
set @output_str_overage_mno = '0'
set @output_str_overage_ins = '0'


declare @bill_adj_m_n_o numeric(14,2)
declare @bill_adj_i_n_s numeric(14,2)
declare @bill_m_n_o_pd numeric(14,2)
declare @bill_i_n_s_pd numeric(14,2)
declare @refund_m_n_o_pd numeric(14,2)
declare @refund_i_n_s_pd numeric(14,2)
declare @discount_mno_pd numeric(14,2)
declare @discount_ins_pd numeric(14,2)
declare @refund_disc_mno_pd numeric(14,2)
declare @refund_disc_ins_pd numeric(14,2)
declare @underage_mno_pd numeric(14,2)
declare @underage_ins_pd numeric(14,2)
declare @refund_underage_mno_pd numeric(14,2)
declare @refund_underage_ins_pd numeric(14,2)
declare @overage_mno_pd numeric(14,2)
declare @overage_ins_pd numeric(14,2)
declare @refund_overage_mno_pd numeric(14,2)
declare @refund_overage_ins_pd numeric(14,2)
declare @pay1_amt numeric(14,2)
declare @pay2_amt numeric(14,2)
declare @pay3_amt numeric(14,2)
declare @pay4_amt numeric(14,2)
declare @pay1_paid numeric(14,2)
declare @pay2_paid numeric(14,2)
declare @pay3_paid numeric(14,2)
declare @pay4_paid numeric(14,2)
declare @pay_type varchar(5)
declare @pay1_due_dt datetime
declare @pay2_due_dt datetime
declare @pay3_due_dt datetime
declare @pay4_due_dt datetime

set @bill_adj_m_n_o = 0.00
set @bill_adj_i_n_s = 0.00
set @bill_m_n_o_pd = 0.00
set @bill_i_n_s_pd = 0.00
set @refund_m_n_o_pd = 0.00
set @refund_i_n_s_pd = 0.00
set @discount_mno_pd = 0.00
set @discount_ins_pd = 0.00
set @refund_disc_mno_pd = 0.00
set @refund_disc_ins_pd = 0.00
set @underage_mno_pd = 0.00
set @underage_ins_pd = 0.00
set @refund_underage_mno_pd = 0.00
set @refund_underage_ins_pd = 0.00
set @overage_mno_pd = 0.00
set @overage_ins_pd = 0.00
set @refund_overage_mno_pd = 0.00
set @refund_overage_ins_pd = 0.00
set @pay1_amt = 0.00
set @pay2_amt = 0.00
set @pay3_amt = 0.00
set @pay4_amt = 0.00
set @pay1_paid = 0.00
set @pay2_paid = 0.00
set @pay3_paid = 0.00
set @pay4_paid = 0.00
set @pay_type = ''
set @pay1_due_dt = null
set @pay2_due_dt = null
set @pay3_due_dt = null
set @pay4_due_dt = null


if (@input_delq_roll = 'F' or @input_delq_roll = 'W')
begin
	select
		@bill_adj_m_n_o = bill.bill_adj_m_n_o,
		@bill_adj_i_n_s = bill.bill_adj_i_n_s,
		@bill_m_n_o_pd = bill.bill_m_n_o_pd,
		@bill_i_n_s_pd = bill.bill_i_n_s_pd,
		@refund_m_n_o_pd = bill.refund_m_n_o_pd,
		@refund_i_n_s_pd = bill.refund_i_n_s_pd,
		@discount_mno_pd = bill.discount_mno_pd,
		@discount_ins_pd = bill.discount_ins_pd,
		@refund_disc_mno_pd = bill.refund_disc_mno_pd,
		@refund_disc_ins_pd = bill.refund_disc_ins_pd,
		@underage_mno_pd = bill.underage_mno_pd,
		@underage_ins_pd = bill.underage_ins_pd,
		@refund_underage_mno_pd = bill.refund_underage_mno_pd,
		@refund_underage_ins_pd = bill.refund_underage_ins_pd,
		@overage_mno_pd = bill.overage_mno_pd,
		@overage_ins_pd = bill.overage_ins_pd,
		@refund_overage_mno_pd = bill.refund_overage_mno_pd,
		@refund_overage_ins_pd = bill.refund_overage_ins_pd,
		@pay1_amt = bill.pay1_amt,
		@pay2_amt = bill.pay2_amt,
		@pay3_amt = bill.pay3_amt,
		@pay4_amt = bill.pay4_amt,
		@pay1_paid = bill.pay1_paid,
		@pay2_paid = bill.pay2_paid,
		@pay3_paid = bill.pay3_paid,
		@pay4_paid = bill.pay4_paid,
		@pay_type = bill.pay_type,
		@pay1_due_dt = bill.pay1_due_dt,
		@pay2_due_dt = bill.pay2_due_dt,
		@pay3_due_dt = bill.pay3_due_dt,
		@pay4_due_dt = bill.pay4_due_dt
	from 
		bill with (nolock)
	inner join
		tax_rate with (nolock)
	on
		tax_rate.entity_id = bill.entity_id
	and	tax_rate.tax_rate_yr = bill.sup_tax_yr
   	where
		bill.bill_id = @input_bill_id
	and	bill.coll_status_cd <> 'RS'
	and
	(
		isnull(bill.active_bill, 'T') = 'T'
	or	tax_rate.collect_option = 'GS'
	)
	--Had to add the 'tax_rate.collect_option = 'GS' option for those entities that generate statements ONLY.
	--Reported by Cooke CAD, HelpSTAR #7633
	--EricZ 05/16/2003, 10/22/2003 (left out, regenerated SQL)
end
else if (@input_delq_roll = 'T')
begin
	select
		@bill_adj_m_n_o = bill.bill_adj_m_n_o,
		@bill_adj_i_n_s = bill.bill_adj_i_n_s,
		@bill_m_n_o_pd = bill.bill_m_n_o_pd,
		@bill_i_n_s_pd = bill.bill_i_n_s_pd,
		@refund_m_n_o_pd = bill.refund_m_n_o_pd,
		@refund_i_n_s_pd = bill.refund_i_n_s_pd,
		@discount_mno_pd = bill.discount_mno_pd,
		@discount_ins_pd = bill.discount_ins_pd,
		@refund_disc_mno_pd = bill.refund_disc_mno_pd,
		@refund_disc_ins_pd = bill.refund_disc_ins_pd,
		@underage_mno_pd = bill.underage_mno_pd,
		@underage_ins_pd = bill.underage_ins_pd,
		@refund_underage_mno_pd = bill.refund_underage_mno_pd,
		@refund_underage_ins_pd = bill.refund_underage_ins_pd,
		@overage_mno_pd = bill.overage_mno_pd,
		@overage_ins_pd = bill.overage_ins_pd,
		@refund_overage_mno_pd = bill.refund_overage_mno_pd,
		@refund_overage_ins_pd = bill.refund_overage_ins_pd,
		@pay1_amt = bill.pay1_amt,
		@pay2_amt = bill.pay2_amt,
		@pay3_amt = bill.pay3_amt,
		@pay4_amt = bill.pay4_amt,
		@pay1_paid = bill.pay1_paid,
		@pay2_paid = bill.pay2_paid,
		@pay3_paid = bill.pay3_paid,
		@pay4_paid = bill.pay4_paid,
		@pay_type = bill.pay_type,
		@pay1_due_dt = bill.pay1_due_dt,
		@pay2_due_dt = bill.pay2_due_dt,
		@pay3_due_dt = bill.pay3_due_dt,
		@pay4_due_dt = bill.pay4_due_dt
 	from
		delq_roll_bill as bill with (nolock)
   	where
		bill.bill_id = @input_bill_id
	and	bill.coll_status_cd <> 'RS'
	and	isnull(bill.active_bill, 'T') = 'T'
end
else if (@input_delq_roll = 'I')
begin
	select
		@bill_adj_m_n_o = bill.bill_adj_m_n_o,
		@bill_adj_i_n_s = bill.bill_adj_i_n_s,
		@bill_m_n_o_pd = bill.bill_m_n_o_pd,
		@bill_i_n_s_pd = bill.bill_i_n_s_pd,
		@refund_m_n_o_pd = bill.refund_m_n_o_pd,
		@refund_i_n_s_pd = bill.refund_i_n_s_pd,
		@discount_mno_pd = bill.discount_mno_pd,
		@discount_ins_pd = bill.discount_ins_pd,
		@refund_disc_mno_pd = bill.refund_disc_mno_pd,
		@refund_disc_ins_pd = bill.refund_disc_ins_pd,
		@underage_mno_pd = bill.underage_mno_pd,
		@underage_ins_pd = bill.underage_ins_pd,
		@refund_underage_mno_pd = bill.refund_underage_mno_pd,
		@refund_underage_ins_pd = bill.refund_underage_ins_pd,
		@overage_mno_pd = bill.overage_mno_pd,
		@overage_ins_pd = bill.overage_ins_pd,
		@refund_overage_mno_pd = bill.refund_overage_mno_pd,
		@refund_overage_ins_pd = bill.refund_overage_ins_pd,
		@pay1_amt = bill.pay1_amt,
		@pay2_amt = bill.pay2_amt,
		@pay3_amt = bill.pay3_amt,
		@pay4_amt = bill.pay4_amt,
		@pay1_paid = bill.pay1_paid,
		@pay2_paid = bill.pay2_paid,
		@pay3_paid = bill.pay3_paid,
		@pay4_paid = bill.pay4_paid,
		@pay_type = bill.pay_type,
		@pay1_due_dt = bill.pay1_due_dt,
		@pay2_due_dt = bill.pay2_due_dt,
		@pay3_due_dt = bill.pay3_due_dt,
		@pay4_due_dt = bill.pay4_due_dt
 	from
		#bill as bill with (nolock)
   	where
		bill.bill_id = @input_bill_id
	and	bill.coll_status_cd <> 'RS'
	and	isnull(bill.active_bill, 'T') = 'T'
end


declare @bill_m_n_o_due numeric(14,2)
declare @bill_i_n_s_due numeric(14,2)
declare @base_tax_due numeric(14,2)

set @bill_m_n_o_due = (@bill_adj_m_n_o - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd + @refund_underage_mno_pd)))
set @bill_i_n_s_due = (@bill_adj_i_n_s - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd + @refund_underage_ins_pd)))
set @base_tax_due = (@bill_m_n_o_due + @bill_i_n_s_due)

declare @pay1_due numeric(14,2)
declare @pay2_due numeric(14,2)
declare @pay3_due numeric(14,2)
declare @pay4_due numeric(14,2)

set @pay1_due = (@pay1_amt - @pay1_paid)
set @pay2_due = (@pay2_amt - @pay2_paid)
set @pay3_due = (@pay3_amt - @pay3_paid)
set @pay4_due = (@pay4_amt - @pay4_paid)


if (@base_tax_due > 0)
begin
	if (@pay_type is null)
	begin
   		exec GetPenaltyInterest
			@input_bill_id,
			0,
			@input_delq_roll,
			@input_effective_date,
			@output_str_penalty_mno output,
			@output_str_penalty_ins output,
			@output_str_interest_mno output,
			@output_str_interest_ins output,
			@output_str_attorney_fee output
	end
	else if (@pay_type = 'Q')
	begin
		exec GetQHBillPenaltyInterest @input_bill_id, 0, @input_delq_roll, @input_effective_date, @pay_type, @output_pay1_penalty_mno output, @output_pay1_penalty_ins output, @output_pay1_interest_mno output, @output_pay1_interest_ins output, @output_pay1_attorney_fee output,
						 @output_pay2_penalty_mno output, @output_pay2_penalty_ins output, @output_pay2_interest_mno output, @output_pay2_interest_ins output, @output_pay2_attorney_fee output,
						 @output_pay3_penalty_mno output, @output_pay3_penalty_ins output, @output_pay3_interest_mno output, @output_pay3_interest_ins output, @output_pay3_attorney_fee output,
						 @output_pay4_penalty_mno output, @output_pay4_penalty_ins output, @output_pay4_interest_mno output, @output_pay4_interest_ins output, @output_pay4_attorney_fee output
		
		set @output_str_penalty_mno = convert(varchar(100),
			convert(numeric(14,2), @output_pay1_penalty_mno) +
			convert(numeric(14,2), @output_pay2_penalty_mno) +
			convert(numeric(14,2), @output_pay3_penalty_mno) +
			convert(numeric(14,2), @output_pay4_penalty_mno))

		set @output_str_penalty_ins = convert(varchar(100),
			convert(numeric(14,2), @output_pay1_penalty_ins) +
			convert(numeric(14,2), @output_pay2_penalty_ins) +
			convert(numeric(14,2), @output_pay3_penalty_ins) +
			convert(numeric(14,2), @output_pay4_penalty_ins))

		set @output_str_interest_mno = convert(varchar(100),
			convert(numeric(14,2), @output_pay1_interest_mno) +
			convert(numeric(14,2), @output_pay2_interest_mno) +
			convert(numeric(14,2), @output_pay3_interest_mno) +
			convert(numeric(14,2), @output_pay4_interest_mno))

		set @output_str_interest_ins = convert(varchar(100),
			convert(numeric(14,2), @output_pay1_interest_ins) +
			convert(numeric(14,2), @output_pay2_interest_ins) +
			convert(numeric(14,2), @output_pay3_interest_ins) +
			convert(numeric(14,2), @output_pay4_interest_ins))

		set @output_str_attorney_fee = convert(varchar(100),
			convert(numeric(14,2), @output_pay1_attorney_fee) +
			convert(numeric(14,2), @output_pay2_attorney_fee) +
			convert(numeric(14,2), @output_pay3_attorney_fee) +
			convert(numeric(14,2), @output_pay4_attorney_fee))
	end
	else if (@pay_type = 'H')
	begin
		if
		(
			((convert(datetime, @input_effective_date) > @pay1_due_dt) and (@pay1_due > 0))
		or	((convert(datetime, @input_effective_date) > @pay2_due_dt) and (@pay2_due > 0))
		)
		begin

			exec GetQHBillPenaltyInterest
				@input_bill_id,
				0,
				@input_delq_roll,
				@input_effective_date,
				@pay_type,
				@output_pay1_penalty_mno output,
				@output_pay1_penalty_ins output,
				@output_pay1_interest_mno output,
				@output_pay1_interest_ins output,
				@output_pay1_attorney_fee output,
				@output_pay2_penalty_mno output,
				@output_pay2_penalty_ins output,
				@output_pay2_interest_mno output,
				@output_pay2_interest_ins output,
				@output_pay2_attorney_fee output,
				@output_pay3_penalty_mno output,
				@output_pay3_penalty_ins output,
				@output_pay3_interest_mno output,
				@output_pay3_interest_ins output,
				@output_pay3_attorney_fee output,
				@output_pay4_penalty_mno output,
				@output_pay4_penalty_ins output,
				@output_pay4_interest_mno output,
				@output_pay4_interest_ins output,
				@output_pay4_attorney_fee output
		
			set @output_str_penalty_mno = convert(varchar(100),
				convert(numeric(14,2), @output_pay1_penalty_mno) +
				convert(numeric(14,2), @output_pay2_penalty_mno) +
				convert(numeric(14,2), @output_pay3_penalty_mno) +
				convert(numeric(14,2), @output_pay4_penalty_mno))

			set @output_str_penalty_ins = convert(varchar(100),
				convert(numeric(14,2), @output_pay1_penalty_ins) +
				convert(numeric(14,2), @output_pay2_penalty_ins) +
				convert(numeric(14,2), @output_pay3_penalty_ins) +
				convert(numeric(14,2), @output_pay4_penalty_ins))

			set @output_str_interest_mno = convert(varchar(100),
				convert(numeric(14,2), @output_pay1_interest_mno) +
				convert(numeric(14,2), @output_pay2_interest_mno) +
				convert(numeric(14,2), @output_pay3_interest_mno) +
				convert(numeric(14,2), @output_pay4_interest_mno))

			set @output_str_interest_ins = convert(varchar(100),
				convert(numeric(14,2), @output_pay1_interest_ins) +
				convert(numeric(14,2), @output_pay2_interest_ins) +
				convert(numeric(14,2), @output_pay3_interest_ins) +
				convert(numeric(14,2), @output_pay4_interest_ins))

			set @output_str_attorney_fee = convert(varchar(100),
				convert(numeric(14,2), @output_pay1_attorney_fee) +
				convert(numeric(14,2), @output_pay2_attorney_fee) +
				convert(numeric(14,2), @output_pay3_attorney_fee) +
				convert(numeric(14,2), @output_pay4_attorney_fee))
		end
	end

	set @output_str_base_tax = convert(varchar(100), @base_tax_due)

	set @output_total = convert(varchar(100),
		convert(numeric(14,2), @output_str_base_tax) +
		convert(numeric(14,2), @output_str_penalty_mno) +
		convert(numeric(14,2), @output_str_penalty_ins) +
		convert(numeric(14,2), @output_str_interest_mno) +
		convert(numeric(14,2), @output_str_interest_ins) +
		convert(numeric(14,2), @output_str_attorney_fee) +
		convert(numeric(14,2), @output_str_discount_mno) +
		convert(numeric(14,2), @output_str_discount_ins) +
		convert(numeric(14,2), @output_str_underage_mno) +
		convert(numeric(14,2), @output_str_underage_ins) +
		convert(numeric(14,2), @output_str_overage_mno) +
		convert(numeric(14,2), @output_str_overage_ins))
end
else if ((@base_tax_due < 0) and (@input_delq_roll <> 'I'))
begin
	if exists
	(
		select
			*
		from
			refund_due_trans with (nolock)
		where
			bill_id = @input_bill_id
	)
	begin
		declare @refund_penalty_mno_amt numeric(14,2)
		declare @refund_penalty_ins_amt numeric(14,2)
		declare @refund_interest_mno_amt numeric(14,2)
		declare @refund_interest_ins_amt numeric(14,2)
		declare @refund_atty_fee_amt numeric(14,2)
		declare @refund_discount_mno_amt numeric(14,2)
		declare @refund_discount_ins_amt numeric(14,2)
		declare @refund_underage_mno_amt numeric(14,2)
		declare @refund_underage_ins_amt numeric(14,2)
		declare @refund_overage_mno_amt numeric(14,2)
		declare @refund_overage_ins_amt numeric(14,2)

		set @refund_penalty_mno_amt = 0.00
		set @refund_penalty_ins_amt = 0.00
		set @refund_interest_mno_amt = 0.00
		set @refund_interest_ins_amt = 0.00
		set @refund_atty_fee_amt = 0.00
		set @refund_discount_mno_amt = 0.00
		set @refund_discount_ins_amt = 0.00
		set @refund_underage_mno_amt = 0.00
		set @refund_underage_ins_amt = 0.00
		set @refund_overage_mno_amt = 0.00
		set @refund_overage_ins_amt = 0.00
		-- Jeremy Wilson 43514 changes
		-- null values in the refund_due_trans fields caused display problems
		select
			@refund_penalty_mno_amt = sum(isnull(penalty_mno_amt, 0)),
	        	@refund_penalty_ins_amt = sum(isnull(penalty_ins_amt, 0)),
	        	@refund_interest_mno_amt = sum(isnull(interest_mno_amt, 0)),
	        	@refund_interest_ins_amt = sum(isnull(interest_ins_amt, 0)),
	        	@refund_atty_fee_amt = sum(isnull(atty_fee_amt, 0)),
			@refund_discount_mno_amt = sum(isnull(discount_mno_amt, 0)),
			@refund_discount_ins_amt = sum(isnull(discount_ins_amt, 0)),
			@refund_underage_mno_amt = sum(isnull(underage_mno_amt, 0)),
			@refund_underage_ins_amt = sum(isnull(underage_ins_amt, 0)),
			@refund_overage_mno_amt = sum(isnull(overage_mno_amt, 0)),
			@refund_overage_ins_amt = sum(isnull(overage_ins_amt, 0))
		from
			refund_due_trans with (nolock)
		where
			bill_id = @input_bill_id


		set @refund_penalty_mno_amt = @refund_penalty_mno_amt * -1
		set @refund_penalty_ins_amt = @refund_penalty_ins_amt * -1
		set @refund_interest_mno_amt = @refund_interest_mno_amt * -1
		set @refund_interest_ins_amt = @refund_interest_ins_amt * -1
		set @refund_atty_fee_amt = @refund_atty_fee_amt * -1
		set @refund_discount_mno_amt = @refund_discount_mno_amt;
		set @refund_discount_ins_amt = @refund_discount_ins_amt;
		set @refund_underage_mno_amt = @refund_underage_mno_amt;
		set @refund_underage_ins_amt = @refund_underage_ins_amt;
		set @refund_overage_mno_amt = @refund_overage_mno_amt * -1
		set @refund_overage_ins_amt = @refund_overage_ins_amt * -1

		set @output_str_penalty_mno  = convert(varchar(100), @refund_penalty_mno_amt)
		set @output_str_penalty_ins  = convert(varchar(100), @refund_penalty_ins_amt)
		set @output_str_interest_mno = convert(varchar(100), @refund_interest_mno_amt)
		set @output_str_interest_ins = convert(varchar(100), @refund_interest_ins_amt)
		set @output_str_attorney_fee = convert(varchar(100), @refund_atty_fee_amt)
		set @output_str_discount_mno = convert(varchar(100), @refund_discount_mno_amt)
		set @output_str_discount_ins = convert(varchar(100), @refund_discount_ins_amt)
		set @output_str_underage_mno = convert(varchar(100), @refund_underage_mno_amt)
		set @output_str_underage_ins = convert(varchar(100), @refund_underage_ins_amt)
		set @output_str_overage_mno = convert(varchar(100), @refund_overage_mno_amt)
		set @output_str_overage_ins = convert(varchar(100), @refund_overage_ins_amt)
	end

	set @output_str_base_tax = convert(varchar(100), @base_tax_due)

	set @output_total = convert(varchar(100),
		convert(numeric(14,2), @output_str_base_tax) +
		convert(numeric(14,2), @output_str_penalty_mno) +
		convert(numeric(14,2), @output_str_penalty_ins) +
		convert(numeric(14,2), @output_str_interest_mno) +
		convert(numeric(14,2), @output_str_interest_ins) +
		convert(numeric(14,2), @output_str_attorney_fee) +
		convert(numeric(14,2), @output_str_discount_mno) +
		convert(numeric(14,2), @output_str_discount_ins) +
		convert(numeric(14,2), @output_str_underage_mno) +
		convert(numeric(14,2), @output_str_underage_ins) +
		convert(numeric(14,2), @output_str_overage_mno) +
		convert(numeric(14,2), @output_str_overage_ins))
end
-- Jeremy Wilson 42944 changes
-- The calling app is the only thing that knows whether or not we are displaying 
-- regular bills or q-pay or h-pay bills on the Taxes Due screen, so we need to
-- know the underage and overage amounts in order to balance the due amounts to zero
-- as well as display them on detail screens.

else
begin
	set @output_str_underage_mno = convert(varchar(100), @underage_mno_pd)
	set @output_str_underage_ins = convert(varchar(100), @underage_ins_pd)
	set @output_str_overage_mno = convert(varchar(100), @overage_mno_pd)
	set @output_str_overage_ins = convert(varchar(100), @overage_ins_pd)

	set @output_str_base_tax = convert(varchar(100), @base_tax_due)

	set @output_total = convert(varchar(100),
		convert(numeric(14,2), @output_str_base_tax) +
		convert(numeric(14,2), @output_str_penalty_mno) +
		convert(numeric(14,2), @output_str_penalty_ins) +
		convert(numeric(14,2), @output_str_interest_mno) +
		convert(numeric(14,2), @output_str_interest_ins) +
		convert(numeric(14,2), @output_str_attorney_fee) +
		convert(numeric(14,2), @output_str_discount_mno) +
		convert(numeric(14,2), @output_str_discount_ins))
end


set @output_pay1_due = convert(varchar(100),
	@pay1_due +
	convert(numeric(14,2), @output_pay1_penalty_mno) +
	convert(numeric(14,2), @output_pay1_penalty_ins) +
	convert(numeric(14,2), @output_pay1_interest_mno) +
	convert(numeric(14,2), @output_pay1_interest_ins) +
	convert(numeric(14,2), @output_pay1_attorney_fee))

set @output_pay1_base_tax = convert(varchar(100), @pay1_due)

set @output_pay2_due = convert(varchar(100),
	@pay2_due +
	convert(numeric(14,2), @output_pay2_penalty_mno) +
	convert(numeric(14,2), @output_pay2_penalty_ins) +
	convert(numeric(14,2), @output_pay2_interest_mno) +
	convert(numeric(14,2), @output_pay2_interest_ins) +
	convert(numeric(14,2), @output_pay2_attorney_fee))

set @output_pay2_base_tax = convert(varchar(100), @pay2_due)

set @output_pay3_due = convert(varchar(100),
	@pay3_due +
	convert(numeric(14,2), @output_pay3_penalty_mno) +
	convert(numeric(14,2), @output_pay3_penalty_ins) +
	convert(numeric(14,2), @output_pay3_interest_mno) +
	convert(numeric(14,2), @output_pay3_interest_ins) +
	convert(numeric(14,2), @output_pay3_attorney_fee))

set @output_pay3_base_tax = convert(varchar(100), @pay3_due)

set @output_pay4_due = convert(varchar(100),
	@pay4_due +
	convert(numeric(14,2), @output_pay4_penalty_mno) +
	convert(numeric(14,2), @output_pay4_penalty_ins) +
	convert(numeric(14,2), @output_pay4_interest_mno) +
	convert(numeric(14,2), @output_pay4_interest_ins) +
	convert(numeric(14,2), @output_pay4_attorney_fee))


set @output_pay4_base_tax = convert(varchar(100), @pay4_due)



set @output_m_n_o_due = convert(varchar(100), @bill_m_n_o_due)
set @output_i_n_s_due = convert(varchar(100), @bill_i_n_s_due)


if (@input_show_output = 1)
begin
	select
		bill_id = @input_bill_id, 
		base_tax = @output_str_base_tax,
       		penalty_mno = @output_str_penalty_mno,
       		penalty_ins = @output_str_penalty_ins,
       		interest_mno = @output_str_interest_mno,
       		interest_ins = @output_str_interest_ins,
       		attorney_fee = @output_str_attorney_fee,
		total = @output_total,
		pay1_due = @output_pay1_due,
		pay1_base_tax = @output_pay1_base_tax,
 		pay1_penalty_mno = @output_pay1_penalty_mno,
 		pay1_penalty_ins = @output_pay1_penalty_ins,
 		pay1_interest_mno = @output_pay1_interest_mno, 
 		pay1_interest_ins = @output_pay1_interest_ins,
 		pay1_attorney_fee = @output_pay1_attorney_fee,
		pay2_due = @output_pay2_due,
		pay2_base_tax = @output_pay2_base_tax,
 		pay2_penalty_mno = @output_pay2_penalty_mno,
 		pay2_penalty_ins = @output_pay2_penalty_ins,
 		pay2_interest_mno = @output_pay2_interest_mno, 
 		pay2_interest_ins = @output_pay2_interest_ins,
 		pay2_attorney_fee = @output_pay2_attorney_fee,
		pay3_due = @output_pay3_due,
		pay3_base_tax = @output_pay3_base_tax,
 		pay3_penalty_mno = @output_pay3_penalty_mno,
 		pay3_penalty_ins = @output_pay3_penalty_ins,
 		pay3_interest_mno = @output_pay3_interest_mno, 
 		pay3_interest_ins = @output_pay3_interest_ins,
 		pay3_attorney_fee = @output_pay3_attorney_fee,
		pay4_due = @output_pay4_due,
		pay4_base_tax = @output_pay4_base_tax,
 		pay4_penalty_mno = @output_pay4_penalty_mno,
 		pay4_penalty_ins = @output_pay4_penalty_ins,
 		pay4_interest_mno = @output_pay4_interest_mno, 
 		pay4_interest_ins = @output_pay4_interest_ins,
 		pay4_attorney_fee = @output_pay4_attorney_fee,
		m_n_o_due = @output_m_n_o_due,
		i_n_s_due = @output_i_n_s_due,
		discount_mno = @output_str_discount_mno,
		discount_ins = @output_str_discount_ins,
		underage_mno = @output_str_underage_mno,
		underage_ins = @output_str_underage_ins,
		overage_mno = @output_str_overage_mno,
		overage_ins = @output_str_overage_ins
end

GO

