





CREATE   PROCEDURE GetIAPenaltyInterest
@input_bill_id      		int,
@input_effective_date      	varchar(100),
@output_str_penalty_mno_amt  	varchar(100) OUTPUT,
@output_str_penalty_ins_amt  	varchar(100) OUTPUT,
@output_str_interest_mno_amt 	varchar(100) OUTPUT,
@output_str_interest_ins_amt 	varchar(100) OUTPUT,
@output_str_attorney_fee_amt 	varchar(100) OUTPUT
AS 
declare @bill_id    		int
declare @entity_id           	int
declare @effective_due_dt    	datetime
declare @sup_tax_yr      	numeric(4)
declare @bill_m_n_o          	numeric(14,2)
declare @bill_i_n_s      	numeric(14,2)
declare @penalty_m_n_o       	numeric(14,2)
declare @penalty_i_n_s       	numeric(14,2)
declare @attorney_fees       	numeric(14,2)
declare @bill_m_n_o_pd      	numeric(14,2)
declare @bill_i_n_s_pd       	numeric(14,2)
declare @penalty_m_n_o_pd    	numeric(14,2)
declare @penalty_i_n_s_pd    	numeric(14,2)
declare @interest_m_n_o_pd   	numeric(14,2)
declare @interest_i_n_s_pd   	numeric(14,2)
declare @attorney_fees_pd    	numeric(14,2)
declare @discount_mno_pd     	numeric(14,2)
declare @discount_ins_pd     	numeric(14,2)

declare @overage_mno_pd      	numeric(14,2)
declare @overage_ins_pd		numeric(14,2)
declare @underage_mno_pd     	numeric(14,2)
declare @underage_ins_pd	numeric(14,2)
declare @refund_m_n_o_pd     	numeric(14,2)
declare @refund_i_n_s_pd	numeric(14,2)
declare @refund_disc_mno_pd	numeric(14,2)
declare @refund_disc_ins_pd	numeric(14,2)

declare @m_n_o_tax_pct       	numeric(13,10)
declare @i_n_s_tax_pct       	numeric(13,10)
declare @prot_i_n_s_tax_pct  	numeric(13,10)
declare @statement_date      	datetime
declare @attorney_fee_date   	datetime
declare @attorney_fee_pct    	numeric(4,2)
declare @month1_int          	numeric(13,10)
declare @month1_penalty      	numeric(13,10)
declare @month2_int          	numeric(13,10)
declare @month2_penalty      	numeric(13,10)
declare @month3_int          	numeric(13,10)
declare @month3_penalty      	numeric(13,10)
declare @month4_int          	numeric(13,10)
declare @month4_penalty      	numeric(13,10)
declare @month5_int          	numeric(13,10)
declare @month5_penalty      	numeric(13,10)
declare @month6_int          	numeric(13,10)
declare @month6_penalty      	numeric(13,10)
declare @month7_int          	numeric(13,10)
declare @month7_penalty      	numeric(13,10)
declare @month8_int          	numeric(13,10)
declare @month8_penalty      	numeric(13,10)
declare @month9_int          	numeric(13,10)
declare @month9_penalty      	numeric(13,10)
declare @post_month          	int
declare @post_day            	int
declare @post_year           	int
declare @due_month           	int
declare @due_day             	int
declare @due_year            	int
declare @delinquent_month    	int
declare @delinquent_day      	int
declare @delinquent_year     	int
declare @diff_month          	int
declare @diff_year           	int
declare @discount_offered    	int
declare @bill_amount      	numeric(14,2)
declare @int_rate            	numeric(13,10)
declare @penalty_rate        	numeric(13,10)
declare @penalty_mno_amt     	numeric(14,2)
declare @penalty_ins_amt     	numeric(14,2)
declare @interest_mno_amt    	numeric(14,2)
declare @interest_ins_amt    	numeric(14,2)
declare @attorney_fee_amt    	numeric(14,2)
declare @bill_type		char(1)
declare @coll_status_cd		char(5)
declare @output_due_dt		datetime
declare @adjustment_code	varchar(10)
declare @adj_effective_date	datetime
declare @adj_expiration_date	datetime
declare @adj_penalty_rate	numeric(13,10)
declare @adj_interest_rate	numeric(13,10)
declare @adj_attorney_fee_rate  numeric(4,2)
declare @use_penalty		char(1)
declare @use_interest		char(1)
declare @use_attorney_fee	char(1)
declare @use_range		char(1)
declare @begin_range		numeric(4)
declare @end_range		numeric(4)
declare @deferral_cd		char(1)
declare @judgement_cd		char(1)
declare @adj_year		numeric(4)
declare @adj_month		int
declare @adj_post_month		int
declare @adj_post_year		numeric(4)
declare @diff_adj_year		int
declare @diff_adj_month		int
declare @stmnt_due_dt		datetime

declare @year_effective_due_dt	datetime


select @penalty_mno_amt   = 0
select @penalty_ins_amt   = 0
select @interest_mno_amt  = 0
select @interest_ins_amt  = 0
select @attorney_fee_amt  = 0

DECLARE BILL CURSOR FAST_FORWARD
FOR select installment_agreement_bill.bill_id,
    	installment_agreement_bill.effective_due_dt,
        installment_agreement_bill.entity_id,
    	installment_agreement_bill.sup_tax_yr,
        installment_agreement_bill.bill_adj_m_n_o,
        installment_agreement_bill.bill_adj_i_n_s,
        installment_agreement_bill.bill_m_n_o_pd,
        installment_agreement_bill.bill_i_n_s_pd,
        installment_agreement_bill.penalty_m_n_o_pd,
    	installment_agreement_bill.penalty_i_n_s_pd,
        installment_agreement_bill.interest_m_n_o_pd,
        installment_agreement_bill.interest_i_n_s_pd,
        installment_agreement_bill.attorney_fees_pd,
    	installment_agreement_bill.discount_mno_pd,
        installment_agreement_bill.discount_ins_pd,
        installment_agreement_bill.underage_mno_pd,
	installment_agreement_bill.underage_ins_pd,
        installment_agreement_bill.overage_mno_pd,
	installment_agreement_bill.overage_ins_pd,
	installment_agreement_bill.refund_m_n_o_pd,
	installment_agreement_bill.refund_i_n_s_pd,
        installment_agreement_bill.bill_type,
        installment_agreement_bill.coll_status_cd,
	installment_agreement_bill.adjustment_code,
	installment_agreement_bill.adj_effective_dt,
	installment_agreement_bill.adj_expiration_dt,
	bill_adjust_code.deferral_cd,
	bill_adjust_code.judgement_cd,
	installment_agreement_bill.refund_disc_mno_pd,
	installment_agreement_bill.refund_disc_ins_pd

    from   installment_agreement_bill, bill_adjust_code
    where  installment_agreement_bill.bill_id = @input_bill_id
    and    installment_agreement_bill.adjustment_code = bill_adjust_code.adjust_cd
    and   (((installment_agreement_bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((installment_agreement_bill.bill_m_n_o_pd + installment_agreement_bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (installment_agreement_bill.refund_m_n_o_pd + installment_agreement_bill.refund_i_n_s_pd + installment_agreement_bill.refund_disc_mno_pd + installment_agreement_bill.refund_disc_ins_pd))) > 0)
    and   (installment_agreement_bill.active_bill = 'T' or
              installment_agreement_bill.active_bill is null)

OPEN BILL
FETCH NEXT FROM BILL into @bill_id,    
       			@effective_due_dt,
        		@entity_id,
       			@sup_tax_yr,
        		@bill_m_n_o,         
       			@bill_i_n_s,     
       			@bill_m_n_o_pd,      
        		@bill_i_n_s_pd,       
        		@penalty_m_n_o_pd,   
        		@penalty_i_n_s_pd,   
        		@interest_m_n_o_pd,  
       			@interest_i_n_s_pd,  
        		@attorney_fees_pd,
       			@discount_mno_pd,
       			@discount_ins_pd,
       			@underage_mno_pd,
			@underage_ins_pd,
       			@overage_mno_pd,
			@overage_ins_pd,
			@refund_m_n_o_pd,
			@refund_i_n_s_pd,
			@bill_type,
			@coll_status_cd,
			@adjustment_code,
			@adj_effective_date,
			@adj_expiration_date,
			@deferral_cd,
			@judgement_cd,
			@refund_disc_mno_pd,	
			@refund_disc_ins_pd

if (@@FETCH_STATUS = 0)
begin	
	if (@deferral_cd is null)
	begin
		select @deferral_cd = 'F'
	end

	if (@judgement_cd is null)
	begin
		select @judgement_cd = 'F'
	end

	select @year_effective_due_dt = convert(datetime, '01/31/' + convert(varchar(4), (@sup_tax_yr+1)))

	/* if the effecitve_due_dt > 01/31/Year then the bill was probably supplemented and a new effective due date
	   was placed on the bill, giving the taxpayer the 30 days to pay the bill without receiving additional penalty
	   interest, etc. However, once that 30 days is up the bill reverts back to the original p&i schedule */
	if ((@effective_due_dt > @year_effective_due_dt) and
	    (convert(datetime, @input_effective_date) > @effective_due_dt))
	begin
		select @effective_due_dt = @year_effective_due_dt
	end 

/* testing */
	if (@adj_effective_date is not null and @adj_effective_date <= @effective_due_dt)
	begin
		select @adj_effective_date = @effective_due_dt
	end 

	
	/* if the bill type is supplement and it has not been paid then get the new effective
		   due date */
	/*if (@bill_type = 'S') AND (@coll_status_cd <> 'P' or @coll_status_cd <> 'RD' or  @coll_status_cd <> 'RS')
	begin
		exec GetSuppDueDate @bill_id, @effective_due_dt, @input_effective_date, 
				    @entity_id, @sup_tax_yr, @output_due_dt output

		select @effective_due_dt = @output_due_dt
	end */

	select @post_month 	= DATEPART(month, @input_effective_date)
	select @post_day   	= DATEPART(day, @input_effective_date)
	select @post_year  	= DATEPART(year, @input_effective_date)
	select @due_month 	= DATEPART(month, @effective_due_dt)
	select @due_day   	= DATEPART(day, @effective_due_dt)
	select @due_year  	= DATEPART(year, @effective_due_dt)
	
	if (@adjustment_code <> 'N') and (@adjustment_code is not null)
	begin
		
		if exists (select * from bill_adjust_code where adjust_cd = @adjustment_code)
		begin
			select @use_penalty           = use_penalty, 
			       @adj_penalty_rate      = penalty_rate, 
			       @use_interest          = use_interest, 
			       @adj_interest_rate     = interest_rate, 
			       @use_attorney_fee      = use_attorney_fee, 
			       @adj_attorney_fee_rate = attorney_fee_rate, 
			       @use_range   = use_range,
			       @begin_range = begin_range, 
			       @end_range   = end_range 
 			from bill_adjust_code
			where adjust_cd = @adjustment_code

			if (@use_range is null)
			begin
				select @use_range = 'F'
			end
			
			if (@use_interest is null)
			begin
				select @use_interest = 'F'
			end

			if (@use_penalty is null)
			begin
				select @use_penalty = 'F'
			end


			if (@use_attorney_fee is null)
			begin
				select @use_attorney_fee = 'F'
			end
		
			/* if the range is true but if the post year is not in the range then we cannot
			   use the deferral code rates */
			if ((@use_range = 'T') and (@post_year < @begin_range or @post_year > @end_range))
			begin
				select @use_interest = 'F'
				select @use_penalty  = 'F'
				select @use_attorney_fee = 'F'	
			end
			else
			begin
				/* deferral codes are some crazy stuff. We will use the interest rate from the 
				   deferral code. However we must calculated penalty, interest, atty_fees up until the
				   point the deferral code was placed on the property. Then from that point on
				   there will be no more penalty and atty fees and the interest rate will
				   accure at the deferral int rate per year */
							        
			if (@deferral_cd = 'T') 
				begin
					if ((@input_effective_date >= @adj_effective_date) and (@adj_expiration_date is null)) or
					   ((@input_effective_date >= @adj_effective_date) and (@input_effective_date <= @adj_expiration_date))
					begin
					
						select @post_month 	= DATEPART(month, @adj_effective_date)
						select @post_day   	= DATEPART(day, @adj_effective_date)
						select @post_year  	= DATEPART(year, @adj_effective_date)
					end
					else
					begin
						select @use_interest = 'F'
						select @use_penalty  = 'F'
						select @use_attorney_fee = 'F'	
					end
				end
						
			end
		end
	end
	else
	begin
		select @use_interest = 'F'
		select @use_penalty  = 'F'
		select @use_attorney_fee = 'F'
	end

	select @diff_year  =  @post_year - @due_year 
        
	DECLARE TAX_RATE  CURSOR  FAST_FORWARD
	FOR select tax_rate.m_n_o_tax_pct,
           tax_rate.i_n_s_tax_pct,
           tax_rate.prot_i_n_s_tax_pct,
           tax_rate.stmnt_dt,
           tax_rate.attorney_fee_dt,
           tax_rate.attorney_fee_pct,
    	   tax_rate.plus_1_penalty_pct,
           tax_rate.plus_1_int_pct,
           tax_rate.plus_2_penalty_pct,
   	   tax_rate.plus_2_int_pct,
           tax_rate.plus_3_penalty_pct,
           tax_rate.plus_3_int_pct,
           tax_rate.plus_4_penalty_pct,
           tax_rate.plus_4_int_pct,
           tax_rate.plus_5_penalty_pct,
           tax_rate.plus_5_int_pct,
           tax_rate.plus_6_penalty_pct,
           tax_rate.plus_6_int_pct,
           tax_rate.plus_7_penalty_pct,
           tax_rate.plus_7_int_pct,
           tax_rate.plus_8_penalty_pct,
           tax_rate.plus_8_int_pct,
           tax_rate.plus_9_penalty_pct,
           tax_rate.plus_9_int_pct,
           effective_due_dt
    	from   tax_rate
    	where  (tax_rate.entity_id = @entity_id)
    	and    (tax_rate.tax_rate_yr = @sup_tax_yr)

	OPEN TAX_RATE
	FETCH NEXT FROM TAX_RATE into @m_n_o_tax_pct, @i_n_s_tax_pct, @prot_i_n_s_tax_pct, 
                              	@statement_date, 
                              	@attorney_fee_date, 
         			@attorney_fee_pct ,
                              	@month1_penalty, @month1_int, 
          			@month2_penalty, @month2_int,
         			@month3_penalty, @month3_int, 
         			@month4_penalty, @month4_int, 
         			@month5_penalty, @month5_int, 
                              	@month6_penalty, @month6_int, 
                              	@month7_penalty, @month7_int, 
                              	@month8_penalty, @month8_int, 
                              	@month9_penalty, @month9_int, @stmnt_due_dt

	if (@@FETCH_STATUS = 0)
	begin

		if (@month1_penalty < 0)
   			select @discount_offered = 1
		else
   			select @discount_offered = 0

		  
		/* calculate the difference in months 
   		   between the statement date and the current date */  
   
		if (@diff_year < 0)
   		begin
      			select @diff_month = ((12 - @post_month) + @due_month) * -1
   		end
		if (@diff_year = 0)
   		begin
      			select @diff_month = @post_month - @due_month
   		end
		else if (@diff_year = 1)
   		begin
      			select @diff_month = (12 - @due_month) + @post_month
   		end
		else if (@diff_year >= 2)
   		begin
      			select @diff_month = (12 - @due_month) + @post_month + ((@diff_year - 1) * 12)
   		end

		/* based on the difference in 

   		month assign an interest rate and penalty rate */
		if (@diff_month <= -3)
   		begin
      			if (@discount_offered = 1) and  ( (@bill_type =  'L') or (@bill_type <> 'L' and @effective_due_dt <= @stmnt_due_dt))
      			begin
         			select @int_rate = 0
         			select @penalty_rate = -3
      			end
      			else
      			begin
         			select @int_rate = 0
         			select @penalty_rate = 0
      			end
   		end
		else if (@diff_month = -2)  and    ( (@bill_type =  'L') or (@bill_type <> 'L' and @effective_due_dt <= @stmnt_due_dt))
   		begin
      			if (@discount_offered = 1)
      			begin
         			select @int_rate = 0
         			select @penalty_rate = -2
      			end
      			else
      			begin
         			select @int_rate = 0
         			select @penalty_rate = 0
      			end
   		end
      
		else if (@diff_month <= -1) and    ( (@bill_type =  'L') or (@bill_type <> 'L' and @effective_due_dt <= @stmnt_due_dt))
   		begin
      			if (@discount_offered = 1)
      			begin
         			select @int_rate = 0
         			select @penalty_rate = -1
      			end
      			else
      			begin
         			select @int_rate = 0
         			select @penalty_rate = 0
      			end
   		end
		else if (@diff_month < 0) and (@bill_type <> 'L')
		begin
			select @int_rate = 0
			select @penalty_rate = 0
		end
		else if (@diff_month = 0)
   		begin
      			select @int_rate = 0
      			select @penalty_rate = 0

 			if (@input_effective_date > @effective_due_dt) and
                                         ( (@deferral_cd <> 'T') or (@deferral_cd = 'T' and @use_interest = 'F' and @use_penalty = 'F' and @use_attorney_fee = 'F'))
			begin
				select @int_rate = 1
				select @penalty_rate = 6
			end
	
		end
   
		else if (@diff_month = 1)
   		begin
      			select @int_rate = 1
      			select @penalty_rate = 6
   		end
      
		else if (@diff_month = 2)
   		begin
      			select @int_rate = 2
      			select @penalty_rate = 7
   		end
      
		else if (@diff_month = 3)
   		begin
      			select @int_rate = 3
      			select @penalty_rate = 8 
   		end
		else if (@diff_month = 4)
   		begin
      			select @int_rate = 4
      			select @penalty_rate = 9
   		end
      
		else if (@diff_month = 5)
   		begin
      			select @int_rate = 5
      			select @penalty_rate = 10
   		end

		/* if the bill hasn't been paid by now then it is big time delinquent. At this stage the penalty will 
   		stay constant at some percentage and the int_rate will continue to accrue at 1% per month. To make this calculation
   		simple I take the diff in months between the statement date & the current date - subtract out the discount months
   		and multiply by 1. */  
		else if (@diff_month >= 6)
   		begin
      			select @int_rate = @diff_month

				-- 2006.01.20 - Jeremy Smith - HS 31664 - Interest Change for Late Installments
				-- Get the interest rate based on the payment due year
				--declare @rate_output as int
				--exec GetPenaltyInterestRate @due_year, @rate_output output
				select  @penalty_rate = 12

   		end 
   
		if (@use_penalty = 'T')
		begin
			select @penalty_rate = @adj_penalty_rate
		end

		if ((@use_interest = 'T') and (@deferral_cd <> 'T'))
		begin
			select @int_rate = @adj_interest_rate
		end

		if (@use_attorney_fee = 'T')
		begin
			select @attorney_fee_pct = @adj_attorney_fee_rate
		end	

		select @bill_amount =  ((@bill_m_n_o + @bill_i_n_s) - 
                 		  ((@bill_m_n_o_pd + @bill_i_n_s_pd + @discount_mno_pd + @discount_ins_pd + @underage_mno_pd +  @underage_ins_pd) - 
		 		  (@refund_m_n_o_pd + @refund_i_n_s_pd))) 

		if (@bill_amount > 0)
		begin
		
			select @interest_mno_amt = ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd))) * (@int_rate/100)
   			select @interest_ins_amt = ((@bill_i_n_s) -      ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd))) * (@int_rate/100)

			select @penalty_mno_amt = ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd))) * (@penalty_rate/100)
   			select @penalty_ins_amt = ((@bill_i_n_s) -      ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd))) * (@penalty_rate/100)	 

			/* if use interest and deferral_cd we must now calculate the interest for the deferral
			   interest rate which will be deferral interest rate * # years */
			if (@use_interest = 'T')
			begin
				if (@deferral_cd = 'T')
				begin
					select @adj_month 	= DATEPART(month, @adj_effective_date)
					select @adj_post_month 	= DATEPART(month, @input_effective_date)
					select @adj_year        = DATEPART(year,  @adj_effective_date)	
					select @adj_post_year   = DATEPART(year,  @input_effective_date)

					select @diff_adj_year  =  @adj_post_year - @adj_year

				
					if (@diff_adj_year < 0)
   					begin
      						select @diff_adj_month = ((12 - @adj_post_month) + @adj_month) * -1
   					end
					else if (@diff_adj_year = 0)
   					begin

      						select @diff_adj_month = @adj_post_month - @adj_month
   					end
					else if (@diff_adj_year = 1)
   					begin
      						select @diff_adj_month = (12 - @adj_month) + @adj_post_month
   					end
					else if (@diff_adj_year >= 2)
   					begin
      						select @diff_adj_month = (12 - @adj_month) + @adj_post_month + ((@diff_adj_year - 1) * 12)
   					end

					if (@diff_adj_month >= 0)
					begin
						select @interest_mno_amt = @interest_mno_amt + ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd)))
                                                                                       * (((@adj_interest_rate/100)/12) * (@diff_adj_month))
						select @interest_ins_amt = @interest_ins_amt + ((@bill_i_n_s) -  ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd)))
                                                                                       * (((@adj_interest_rate/100)/12) * (@diff_adj_month))
					end
				end
				else if (@judgement_cd = 'T')
				begin

					/* if @judgement_cd = 'T' ignore any previous interest_mno calculated */
					select @interest_mno_amt = 0
					select @interest_ins_amt   = 0

					/* with grayson cad have to count start moth so add 1 to @diff_month */
					if (@diff_month + 1>= 0)
					begin
						select @interest_mno_amt = @interest_mno_amt + ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd)))
                                                                                       * (((@adj_interest_rate/100)/12) * (@diff_month + 1))
						select @interest_ins_amt = @interest_ins_amt + ((@bill_i_n_s) - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd)))

                                                                                        * (((@adj_interest_rate/100)/12) * (@diff_month + 1))
			
					end
				end
										
			end

   			/* check to see if the current date is greater than the attorney fee date, 
      			   if so tack on attorney fees */
   			if   ((@input_effective_date >= @attorney_fee_date and @attorney_fee_date >= @effective_due_dt)
			 or (@effective_due_dt > @attorney_fee_date and @input_effective_date >  @effective_due_dt)
 			 or (@diff_month > 0 and @use_attorney_fee = 'T')) 
   			begin
				/* do not calculate atty fees if the deferral code has not expired. if @deferral_cd = 'T' and @use_interest = 'T'
				    then the deferral code has not expired */
				if (@deferral_cd = 'T' and @use_interest = 'T')
			             begin
					select @attorney_fee_amt = 0
				end
				else
				begin
      					select @attorney_fee_amt = ((@bill_amount + @penalty_mno_amt + @penalty_ins_amt 
                                   			    	+ @interest_mno_amt + @interest_ins_amt) * (@attorney_fee_pct/100))
   				end
			end
   			else
   			begin
      				select @attorney_fee_amt = 0
   			end
		end
		else
		begin
   			select @penalty_mno_amt   = 0
   			select @penalty_ins_amt   = 0
   			select @interest_mno_amt  = 0
   			select @interest_ins_amt  = 0
   			select @attorney_fee_amt  = 0
		end
	end

	CLOSE TAX_RATE
	DEALLOCATE TAX_RATE

end

select @output_str_penalty_mno_amt = convert(varchar(100), @penalty_mno_amt)
select @output_str_penalty_ins_amt = convert(varchar(100), @penalty_ins_amt)
select @output_str_interest_mno_amt = convert(varchar(100), @interest_mno_amt)
select @output_str_interest_ins_amt = convert(varchar(100), @interest_ins_amt)
select @output_str_attorney_fee_amt = convert(varchar(100), @attorney_fee_amt) 

CLOSE BILL
DEALLOCATE BILL

return 0

GO

