





CREATE PROCEDURE GetIABillTaxDue
@input_bill_id      		int,
@input_effective_date      	varchar(100),
@output_str_base_tax		varchar(100) OUTPUT,
@output_str_penalty_mno  	varchar(100) OUTPUT,
@output_str_penalty_ins  	varchar(100) OUTPUT,
@output_str_interest_mno 	varchar(100) OUTPUT,
@output_str_interest_ins 	varchar(100) OUTPUT,
@output_str_attorney_fee 	varchar(100) OUTPUT,
@output_total			varchar(100) OUTPUT

AS 

declare @base_tax_due 		numeric(14,2)
declare @disc_underage 		numeric(14,2)
declare @disc_und_mno		numeric(14,2)
declare @disc_und_ins   	numeric(14,2)
declare @mno_pd			numeric(14,2)
declare @ins_pd			numeric(14,2)
declare @base_tax_pd		numeric(14,2)
declare @mno_due		numeric(14,2)
declare @ins_due		numeric(14,2)
declare @ref_disc_mno_due 	numeric(14,2)
declare @ref_disc_ins_due	numeric(14,2)

select @base_tax_due 		 = 0
select @ref_disc_mno_due	 = 0
select @ref_disc_ins_due	 = 0
select @output_str_base_tax	 = '0'
select @output_str_penalty_mno   = '0'
select @output_str_penalty_ins   = '0'
select @output_str_interest_mno  = '0'
select @output_str_interest_ins  = '0'
select @output_str_attorney_fee  = '0'
select @output_total		 = '0'

begin
	select @base_tax_due = (installment_agreement_bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((installment_agreement_bill.bill_m_n_o_pd + installment_agreement_bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (installment_agreement_bill.refund_m_n_o_pd + installment_agreement_bill.refund_i_n_s_pd + installment_agreement_bill.refund_disc_mno_pd + installment_agreement_bill.refund_disc_ins_pd)),

		           	@disc_underage = (discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd),
			@mno_pd = (bill_m_n_o_pd),
			@ins_pd   = (bill_i_n_s_pd),
			@disc_und_mno = (discount_mno_pd + underage_mno_pd),
			@disc_und_ins   = (discount_ins_pd + underage_ins_pd),
			@base_tax_pd    = (bill_m_n_o_pd + bill_i_n_s_pd),
			@mno_due = (installment_agreement_bill.bill_adj_m_n_o ) - 
                 		  ((installment_agreement_bill.bill_m_n_o_pd  + discount_mno_pd + underage_mno_pd ) - 
		 		  (installment_agreement_bill.refund_m_n_o_pd + installment_agreement_bill.refund_disc_mno_pd )),
			@ins_due = (installment_agreement_bill.bill_adj_i_n_s ) - 
                 		  ((installment_agreement_bill.bill_i_n_s_pd  + discount_ins_pd + underage_ins_pd ) - 
		 		  (installment_agreement_bill.refund_i_n_s_pd + installment_agreement_bill.refund_disc_ins_pd))

           		from installment_agreement_bill
           		where  installment_agreement_bill.bill_id = @input_bill_id
           		and ( installment_agreement_bill.coll_status_cd <> 'RS')
           		and ( installment_agreement_bill.active_bill = 'T' or installment_agreement_bill.active_bill is null)
	
	if (@base_tax_due > 0)
	begin

		execute GetIAPenaltyInterest @input_bill_id, @input_effective_date, @output_str_penalty_mno OUTPUT,  @output_str_penalty_ins OUTPUT,
              			      @output_str_interest_mno OUTPUT, @output_str_interest_ins OUTPUT,
       				      @output_str_attorney_fee OUTPUT
	end
	else if (@base_tax_due < 0)
	begin
		/* must subtract (in this case add) out discount & overage since we will not be refunding the discount & overage amounts */

		select @base_tax_due = @base_tax_due

		if (@disc_underage <> 0)
		begin
			if (@mno_pd > 0)
			begin
				select @ref_disc_mno_due = @mno_due
				select @mno_due = @mno_due * (1 - ((@disc_und_mno)/(@mno_pd + @disc_und_mno)))
				select @ref_disc_mno_due = @ref_disc_mno_due - @mno_due
			end

			if (@ins_pd > 0)
			begin
				select @ref_disc_ins_due = @ins_due
				select @ins_due = @ins_due * (1 - ((@disc_und_ins)/(@ins_pd + @disc_und_ins)))
				select @ref_disc_ins_due = @ref_disc_ins_due - @ins_due
			end

			select @base_tax_due = @mno_due + @ins_due
		end

		if exists (select * from refund_due_trans where bill_id = @input_bill_id)
		begin

			declare @ref_penalty_mno_amt		numeric(14,2)
			declare @ref_penalty_ins_amt		numeric(14,2)
			declare @ref_interest_mno_amt		numeric(14,2)
			declare @ref_interest_ins_amt		numeric(14,2)
			declare @ref_atty_fee_amt		numeric(14,2)

			select @ref_penalty_mno_amt =  sum(penalty_mno_amt),
		        	  @ref_penalty_ins_amt = 	sum(penalty_ins_amt),
		        	  @ref_interest_mno_amt =	sum(interest_mno_amt),
		        	  @ref_interest_ins_amt = 	sum(interest_ins_amt),
		        	  @ref_atty_fee_amt = 	sum(atty_fee_amt)
			from refund_due_trans
			where bill_id = @input_bill_id

			select @ref_penalty_mno_amt = @ref_penalty_mno_amt * -1,
				@ref_penalty_ins_amt = @ref_penalty_ins_amt * -1,
				@ref_interest_mno_amt = @ref_interest_mno_amt * -1,
				@ref_interest_ins_amt = @ref_interest_ins_amt * -1,
				@ref_atty_fee_amt = @ref_atty_fee_amt * -1

			select 	@output_str_penalty_mno = convert(varchar(100), @ref_penalty_mno_amt),
				@output_str_penalty_ins   = convert(varchar(100), @ref_penalty_ins_amt),
				@output_str_interest_mno = convert(varchar(100), @ref_interest_mno_amt),
				@output_str_interest_ins   = convert(varchar(100), @ref_interest_ins_amt),
				@output_str_attorney_fee = convert(varchar(100), @ref_atty_fee_amt)
		end
	end
		   


        select @output_str_base_tax = convert(varchar(100), @base_tax_due)
	select @output_total = 	convert(varchar(100),     (convert(numeric(14,2), @output_str_base_tax) + 
							convert(numeric(14,2), @output_str_penalty_mno) + 
							convert(numeric(14,2), @output_str_penalty_ins) + 
							convert(numeric(14,2), @output_str_interest_mno) + 
							convert(numeric(14,2), @output_str_interest_ins) + 
							convert(numeric(14,2), @output_str_attorney_fee)))
end

GO

