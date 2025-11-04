

CREATE     procedure  GetQHBillPenaltyInterest
@input_bill_id		  int, 
@input_show_output	  int, 
@input_delq_roll	  char(1), 
@input_effective_date	  datetime,
@input_pay_type		  varchar(5),
@output_pay1_penalty_mno  varchar(100) OUTPUT, 
@output_pay1_penalty_ins  varchar(100) OUTPUT,
@output_pay1_interest_mno varchar(100) OUTPUT,
@output_pay1_interest_ins varchar(100) OUTPUT, 
@output_pay1_attorney_fee varchar(100) OUTPUT,
@output_pay2_penalty_mno  varchar(100) OUTPUT, 
@output_pay2_penalty_ins  varchar(100) OUTPUT,
@output_pay2_interest_mno varchar(100) OUTPUT,
@output_pay2_interest_ins varchar(100) OUTPUT, 
@output_pay2_attorney_fee varchar(100) OUTPUT,
@output_pay3_penalty_mno  varchar(100) OUTPUT, 
@output_pay3_penalty_ins  varchar(100) OUTPUT,
@output_pay3_interest_mno varchar(100) OUTPUT,
@output_pay3_interest_ins varchar(100) OUTPUT, 
@output_pay3_attorney_fee varchar(100) OUTPUT,
@output_pay4_penalty_mno  varchar(100) OUTPUT, 
@output_pay4_penalty_ins  varchar(100) OUTPUT,
@output_pay4_interest_mno varchar(100) OUTPUT,
@output_pay4_interest_ins varchar(100) OUTPUT, 
@output_pay4_attorney_fee varchar(100) OUTPUT

as

declare @post_month	int
declare @post_day	int
declare @post_year	int
declare @due_month	int
declare @due_day	int
declare @due_year	int
declare @diff_year	int
declare @diff_month	int

declare @entity_id	int
declare @sup_tax_yr	numeric(4)
declare @attorney_fee_dt datetime
declare @attorney_fee_pct numeric(4,2)


declare @pay1_due_dt	datetime
declare @pay2_due_dt	datetime
declare @pay3_due_dt	datetime
declare @pay4_due_dt 	datetime

declare @pay1_due_month	int
declare @pay1_due_day	int
declare @pay1_due_year	int
declare @pay2_due_month	int
declare @pay2_due_day	int
declare @pay2_due_year	int
declare @pay3_due_month	int
declare @pay3_due_day	int
declare @pay3_due_year	int
declare @pay4_due_month	int
declare @pay4_due_day	int
declare @pay4_due_year	int

declare @penalty_rate	int
declare @interest_rate	int
declare @rate_output	int

declare @mno_rate	numeric(13, 10)

declare @adjustment_code	varchar(10)
declare @use_penalty		char(1)
declare @use_interest		char(1)
declare @use_attorney_fee	char(1)
declare @adj_penalty_rate	numeric(13,10)
declare @adj_interest_rate	numeric(13,10)
declare @adj_attorney_fee_rate	numeric(13,10)


declare @bill_adj_mno	numeric(14,2)
declare @bill_adj_ins	numeric(14,2)
declare @pay1_due		numeric(14,2)
declare @pay2_due		numeric(14,2)
declare @pay3_due		numeric(14,2)
declare @pay4_due		numeric(14,2)
declare @deferral_cd		varchar(1)
declare @def_expired		varchar(1)
declare @adj_expiration_date	datetime
declare @adj_effective_date	datetime
declare @use_range		varchar(1)
declare @begin_range		numeric(4)
declare @end_range		numeric(4)

if (@input_delq_roll = 'F' or @input_delq_roll = 'W')
begin
	select 	@bill_adj_mno		= bill_adj_m_n_o,
		@bill_adj_ins		= bill_adj_i_n_s,
		@pay1_due		= pay1_amt - pay1_paid,
		@pay2_due		= pay2_amt - pay2_paid,
		@pay3_due		= pay3_amt - pay3_paid,
		@pay4_due		= pay4_amt - pay4_paid,
		@pay1_due_dt		= pay1_due_dt,
		@pay2_due_dt		= pay2_due_dt,
		@pay3_due_dt		= pay3_due_dt,
		@pay4_due_dt		= pay4_due_dt,
		@entity_id		= entity_id,
		@sup_tax_yr		= sup_tax_yr,
		@adjustment_code	= adjustment_code,
		@adj_expiration_date	= adj_expiration_dt,
		@adj_effective_date	= adj_effective_dt,
		@deferral_cd		= deferral_cd
	from
		bill b, bill_adjust_code bac
	where
		b.adjustment_code = bac.adjust_cd
	and	b.bill_id = @input_bill_id
end
else
begin
	select 	@bill_adj_mno		= bill_adj_m_n_o,
		@bill_adj_ins		= bill_adj_i_n_s,
		@pay1_due		= pay1_amt - pay1_paid,
		@pay2_due		= pay2_amt - pay2_paid,
		@pay3_due		= pay3_amt - pay3_paid,
		@pay4_due		= pay4_amt - pay4_paid,
		@pay1_due_dt		= pay1_due_dt,
		@pay2_due_dt		= pay2_due_dt,
		@pay3_due_dt		= pay3_due_dt,
		@pay4_due_dt		= pay4_due_dt,
		@entity_id		= entity_id,
		@sup_tax_yr		= sup_tax_yr,
		@adjustment_code	= adjustment_code,
		@adj_expiration_date	= adj_expiration_dt,
		@adj_effective_date	= adj_effective_dt,
		@deferral_cd		= deferral_cd
	from
		delq_roll_bill drb, bill_adjust_code bac
	where
		drb.adjustment_code = bac.adjust_cd
	and	drb.bill_id = @input_bill_id
end

if (@deferral_cd is null)
begin
	set @deferral_cd = 'F'
end


set @def_expired = 'F'
-- If 180 days have passed since the expiration date ,set deferral_cd to F
if (@input_effective_date >= (@adj_expiration_date + 181))
begin
	set @deferral_cd = 'F'
	set @def_expired = 'T'
end



select @mno_rate = (@bill_adj_mno)/(@bill_adj_mno + @bill_adj_ins)

if exists
(
	select *
	from tax_rate
	where entity_id = @entity_id
	and tax_rate_yr = @sup_tax_yr
)
begin
	--Added case statement and pacs_system logic as a temp fix to HS #10579
	--EricZ 07/07/2003
	--NEW
	select @attorney_fee_dt = case when pacs_system.tax_yr = @sup_tax_yr and @input_pay_type = 'H'
					then DATEADD(Month, 1, tax_rate.attorney_fee_dt)
					else tax_rate.attorney_fee_dt end,
		@attorney_fee_pct = attorney_fee_pct
	from tax_rate, pacs_system
	where entity_id = @entity_id
	and tax_rate_yr = @sup_tax_yr

	--OLD
	/*
	select @attorney_fee_dt = attorney_fee_dt,
		@attorney_fee_pct = attorney_fee_pct
	from tax_rate
	where entity_id = @entity_id
	and tax_rate_yr = @sup_tax_yr
	*/
end
else
begin
	select @attorney_fee_dt = null
	select @attorney_fee_pct = 0
end


select @post_month 	= DATEPART(month, @input_effective_date)
select @post_day   	= DATEPART(day,   @input_effective_date)
select @post_year  	= DATEPART(year,  @input_effective_date)

if (@adjustment_code <> 'N' and @adjustment_code is not null)
begin
	if exists (select * from bill_adjust_code where adjust_cd = @adjustment_code)
	begin
		select  @use_penalty		= IsNull(use_penalty, 'F'), 
			@adj_penalty_rate	= IsNull(penalty_rate, 0),
			@use_interest		= IsNull(use_interest, 'F'), 
			@adj_interest_rate	= IsNull(interest_rate, 0), 
			@use_attorney_fee	= IsNull(use_attorney_fee, 'F'), 
			@adj_attorney_fee_rate	= IsNull(attorney_fee_rate, 0),
			@use_range		= IsNull(use_range,'F'),
			@begin_range		= begin_range,
			@end_range		= end_range	
 		from bill_adjust_code
		where adjust_cd = @adjustment_code
		
		/* if the range is true but if the post year is not in the range then we cannot
		   use the deferral code rates */
		if ((@use_range = 'T') and (@post_year < @begin_range or @post_year > @end_range))
		begin
			set @use_interest 	= 'F'
			set @use_penalty  	= 'F'
			set @use_attorney_fee 	= 'F'	
		end
		else
		begin
			--Deferral codes are some crazy stuff. We will use the interest rate from the 
			--deferral code. However we must calculated penalty, interest, atty_fees up until the
			--point the deferral code was placed on the property. Then from that point on
			--there will be no more penalty and atty fees and the interest rate will
			--accure at the deferral int rate per year		        
			if (@deferral_cd = 'T') 
			begin
				if ((@input_effective_date >= @adj_effective_date) and (@adj_expiration_date is null)) or
				   ((@input_effective_date >= @adj_effective_date) and (@input_effective_date <= ( @adj_expiration_date + 181)))-- added 181 so regular P & I kicks in after 180 days
				begin
				
					set @post_month 	= DATEPART(month, 	@adj_effective_date)
					set @post_day   	= DATEPART(day, 	@adj_effective_date)
					set @post_year  	= DATEPART(year, 	@adj_effective_date)
				end
				else
				begin
					set @use_interest 	= 'F'
					set @use_penalty  	= 'F'
					set @use_attorney_fee 	= 'F'	
				end
			end
					
		end

	end
	else
	begin
		select @use_penalty = 'F'
		select @use_interest = 'F'
		select @use_attorney_fee = 'F'
	end
end

/******************************************/
-- calculate quarter 1 penalty & interest
/******************************************/
select @due_month 	= DATEPART(month, @pay1_due_dt)
select @due_day   	= DATEPART(day,   @pay1_due_dt)
select @due_year  	= DATEPART(year,  @pay1_due_dt)

if (@input_effective_date > @pay1_due_dt)
begin
	select @diff_year  =  @post_year - @due_year 

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

	if (@use_attorney_fee = 'T')
	begin
		select @attorney_fee_pct = @adj_attorney_fee_rate 
	end

	if (@use_penalty = 'T')
	begin
		select @penalty_rate = @adj_penalty_rate
	end
	else
	begin
		-- Get the interest rate based on the payment due year, pay type, and deferral info
		exec GetPenaltyInterestRate @due_year, @input_pay_type, @deferral_cd, @def_expired, @rate_output output
		select  @penalty_rate = @rate_output
	end

	if (@use_interest = 'T')
	begin	
		select @interest_rate = @adj_interest_rate
	end
	else
	begin
		-- 2006.06.15 - Jeremy Smith - HS 27592 - Add deferral logic
		if @deferral_cd = 'T' and @def_expired <> 'T'
		begin
			-- interest calculates at .67% per month beginning in the first month of delinquency
			select @interest_rate = @diff_month * 0.67
		end
		else
		begin
			select @interest_rate = @diff_month
		end
	end

	select @output_pay1_penalty_mno  = convert(varchar(100), convert(numeric(14,2), ((@pay1_due * @mno_rate) * @penalty_rate/100)))
	select @output_pay1_penalty_ins  = convert(varchar(100), convert(numeric(14,2), ((@pay1_due - (@pay1_due * @mno_rate)) * @penalty_rate/100)))
	select @output_pay1_interest_mno = convert(varchar(100), convert(numeric(14,2), ((@pay1_due * @mno_rate) * @interest_rate/100)))
	select @output_pay1_interest_ins = convert(varchar(100), convert(numeric(14,2), ((@pay1_due - (@pay1_due * @mno_rate)) * @interest_rate/100)))

--and @attorney_fee_dt <= @pay1_due_dt


	if (@attorney_fee_dt is not null and @input_effective_date >= @attorney_fee_dt)
	begin
		select @output_pay1_attorney_fee =  convert(varchar(100), (@pay1_due + convert(numeric(14,2), @output_pay1_penalty_mno)
							+ convert(numeric(14,2), @output_pay1_penalty_ins)
							+ convert(numeric(14,2), @output_pay1_interest_mno)
							+ convert(numeric(14,2), @output_pay1_interest_ins)) * (@attorney_fee_pct/100))
	end
	else
	begin
		select @output_pay1_attorney_fee = '0'
	end

end
else
begin
	select @output_pay1_penalty_mno  = '0'
	select @output_pay1_penalty_ins  = '0'
	select @output_pay1_interest_mno = '0'
	select @output_pay1_interest_ins = '0'
	select @output_pay1_attorney_fee = '0'
end



/******************************************/
-- calculate quarter 2 penalty & interest
/******************************************/
select @due_month 	= DATEPART(month, @pay2_due_dt)
select @due_day   	= DATEPART(day,   @pay2_due_dt)
select @due_year  	= DATEPART(year,  @pay2_due_dt)

if (@input_effective_date > @pay2_due_dt)
begin

	select @diff_year  =  @post_year - @due_year 

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
		select @diff_month = (12 - @due_month) + @post_month	end
	else if (@diff_year >= 2)
	begin
      		select @diff_month = (12 - @due_month) + @post_month + ((@diff_year - 1) * 12)
	end

	if (@use_attorney_fee = 'T')
	begin
		select @attorney_fee_pct = @adj_attorney_fee_rate 
	end

	if (@use_penalty = 'T')
	begin
		select @penalty_rate = @adj_penalty_rate
	end
	else
	begin
		-- Get the interest rate based on the payment due year, pay type, and deferral info
		exec GetPenaltyInterestRate @due_year, @input_pay_type, @deferral_cd, @def_expired, @rate_output output
		select  @penalty_rate = @rate_output
	end

	if (@use_interest = 'T')
	begin	
		select @interest_rate = @adj_interest_rate
	end
	else
	begin
		select @interest_rate = @diff_month
	end

	select @output_pay2_penalty_mno  = convert(varchar(100),  convert(numeric(14,2), ((@pay2_due * @mno_rate) * @penalty_rate/100)))
	select @output_pay2_penalty_ins  = convert(varchar(100),  convert(numeric(14,2),  ((@pay2_due - (@pay2_due * @mno_rate)) * @penalty_rate/100)))
	select @output_pay2_interest_mno = convert(varchar(100),  convert(numeric(14,2), ((@pay2_due * @mno_rate) * @interest_rate/100)))
	select @output_pay2_interest_ins = convert(varchar(100),  convert(numeric(14,2), ((@pay2_due - (@pay2_due * @mno_rate)) * @interest_rate/100)))
	
	
	if (@attorney_fee_dt is not null and @input_effective_date >= @attorney_fee_dt)
	begin
		select @output_pay2_attorney_fee =  convert(varchar(100), (@pay2_due + convert(numeric(14,2), @output_pay2_penalty_mno)
							+ convert(numeric(14,2), @output_pay2_penalty_ins)
							+ convert(numeric(14,2), @output_pay2_interest_mno)
							+ convert(numeric(14,2), @output_pay2_interest_ins)) * (@attorney_fee_pct/100))
	end
	else
	begin
		select @output_pay2_attorney_fee = '0'
	end

end
else
begin
	select @output_pay2_penalty_mno  = '0'
	select @output_pay2_penalty_ins  = '0'
	select @output_pay2_interest_mno = '0'
	select @output_pay2_interest_ins = '0'
	select @output_pay2_attorney_fee = '0'
end


/******************************************/
-- calculate quarter 3 penalty & interest
/******************************************/
if (@input_pay_type = 'Q')
begin
	select @due_month 	= DATEPART(month, @pay3_due_dt)
	select @due_day   	= DATEPART(day,   @pay3_due_dt)
	select @due_year  	= DATEPART(year,  @pay3_due_dt)
	
	if (@input_effective_date > @pay3_due_dt)
	begin
	
		select @diff_year  =  @post_year - @due_year 
	
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
	
		if (@use_attorney_fee = 'T')
		begin
			select @attorney_fee_pct = @adj_attorney_fee_rate 
		end
	
		if (@use_penalty = 'T')
		begin
			select @penalty_rate = @adj_penalty_rate
		end
		else
		begin
			-- Get the interest rate based on the payment due year, pay type, and deferral info
			exec GetPenaltyInterestRate @due_year, @input_pay_type, @deferral_cd, @def_expired, @rate_output output
			select  @penalty_rate = @rate_output
		end
	
		if (@use_interest = 'T')
		begin	
			select @interest_rate = @adj_interest_rate
		end
		else
		begin
			select @interest_rate = @diff_month
		end
	
		select @output_pay3_penalty_mno  = convert(varchar(100),  convert(numeric(14,2), ((@pay3_due * @mno_rate) * @penalty_rate/100)))
		select @output_pay3_penalty_ins  = convert(varchar(100), convert(numeric(14,2),  ((@pay3_due - (@pay3_due * @mno_rate)) * @penalty_rate/100)))
		select @output_pay3_interest_mno = convert(varchar(100),  convert(numeric(14,2), ((@pay3_due * @mno_rate) * @interest_rate/100)))
		select @output_pay3_interest_ins = convert(varchar(100),  convert(numeric(14,2), ((@pay3_due - (@pay3_due * @mno_rate)) * @interest_rate/100)))
		
		
		if (@attorney_fee_dt is not null  and @input_effective_date >= @attorney_fee_dt)
		begin
			select @output_pay3_attorney_fee =  convert(varchar(100), (@pay3_due + convert(numeric(14,2), @output_pay3_penalty_mno)
								+ convert(numeric(14,2), @output_pay3_penalty_ins)
								+ convert(numeric(14,2), @output_pay3_interest_mno)
								+ convert(numeric(14,2), @output_pay3_interest_ins)) * (@attorney_fee_pct/100))
		end
		else
		begin
			select @output_pay3_attorney_fee = '0'
		end
	
	end
	else
	begin
		select @output_pay3_penalty_mno  = '0'
		select @output_pay3_penalty_ins  = '0'
		select @output_pay3_interest_mno = '0'
		select @output_pay3_interest_ins = '0'
		select @output_pay3_attorney_fee = '0'
	end
	
	
	
	/******************************************/
	-- calculate quarter 4 penalty & interest
	/******************************************/
	select @due_month 	= DATEPART(month, @pay4_due_dt)
	select @due_day   	= DATEPART(day,   @pay4_due_dt)
	select @due_year  	= DATEPART(year,  @pay4_due_dt)
	
	if (@input_effective_date > @pay4_due_dt)
	begin
	
		select @diff_year  =  @post_year - @due_year 
	
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
	
		if (@use_attorney_fee = 'T')
		begin
			select @attorney_fee_pct = @adj_attorney_fee_rate 
		end
	
		if (@use_penalty = 'T')
		begin
			select @penalty_rate = @adj_penalty_rate
		end
		else
		begin
			-- Get the interest rate based on the payment due year, pay type, and deferral info
			exec GetPenaltyInterestRate @due_year, @input_pay_type, @deferral_cd, @def_expired, @rate_output output
			select  @penalty_rate = @rate_output
		end
	
		if (@use_interest = 'T')
		begin	
			select @interest_rate = @adj_interest_rate
		end
		else
		begin
			select @interest_rate = @diff_month
		end
	
		select @output_pay4_penalty_mno  = convert(varchar(100),  convert(numeric(14,2),  ((@pay4_due * @mno_rate) * @penalty_rate/100)))
		select @output_pay4_penalty_ins  = convert(varchar(100), convert(numeric(14,2),  ((@pay4_due - (@pay4_due * @mno_rate)) * @penalty_rate/100)))
		select @output_pay4_interest_mno = convert(varchar(100),  convert(numeric(14,2), ((@pay4_due * @mno_rate) * @interest_rate/100)))
		select @output_pay4_interest_ins = convert(varchar(100),  convert(numeric(14,2), ((@pay4_due - (@pay4_due * @mno_rate)) * @interest_rate/100)))
			
		if (@attorney_fee_dt is not null  and @input_effective_date >= @attorney_fee_dt)
		begin
			select @output_pay4_attorney_fee =  convert(varchar(100), (@pay4_due + convert(numeric(14,2), @output_pay4_penalty_mno)
								+ convert(numeric(14,2), @output_pay4_penalty_ins)
								+ convert(numeric(14,2), @output_pay4_interest_mno)
								+ convert(numeric(14,2), @output_pay4_interest_ins)) * (@attorney_fee_pct/100))
		end
		else
		begin
			select @output_pay4_attorney_fee = '0'
		end
	
	end
	else
	begin
		select @output_pay4_penalty_mno  = '0'
		select @output_pay4_penalty_ins  = '0'
		select @output_pay4_interest_mno = '0'
		select @output_pay4_interest_ins = '0'
		select @output_pay4_attorney_fee = '0'
	end
end
else
begin
	select @output_pay3_penalty_mno  = '0'
	select @output_pay3_penalty_ins  = '0'
	select @output_pay3_interest_mno = '0'
	select @output_pay3_interest_ins = '0'
	select @output_pay3_attorney_fee = '0'

	select @output_pay4_penalty_mno  = '0'
	select @output_pay4_penalty_ins  = '0'
	select @output_pay4_interest_mno = '0'
	select @output_pay4_interest_ins = '0'
	select @output_pay4_attorney_fee = '0'
end

if (@input_show_output = 1)
begin
 	select  bill_id         = @input_bill_id,
	        pay1_penalty_mno  = @output_pay1_penalty_mno, 
	        pay1_penalty_ins  = @output_pay1_penalty_ins,
		pay1_interest_mno = @output_pay1_interest_mno,
		pay1_interest_ins = @output_pay1_interest_ins, 
		pay1_attorney_fee = @output_pay1_attorney_fee,
		pay2_penalty_mno  = @output_pay2_penalty_mno, 
		pay2_penalty_ins  = @output_pay2_penalty_ins,
		pay2_interest_mno = @output_pay2_interest_mno,
		pay2_interest_ins = @output_pay2_interest_ins, 
		pay2_attorney_fee = @output_pay2_attorney_fee,
		pay3_penalty_mno  = @output_pay3_penalty_mno, 
		pay3_penalty_ins  = @output_pay3_penalty_ins,
		pay3_interest_mno = @output_pay3_interest_mno,
		pay3_interest_ins = @output_pay3_interest_ins, 
		pay3_attorney_fee = @output_pay3_attorney_fee,
		pay4_penalty_mno  = @output_pay4_penalty_mno, 
		pay4_penalty_ins  = @output_pay4_penalty_ins,
		pay4_interest_mno = @output_pay4_interest_mno,
		pay4_interest_ins = @output_pay4_interest_ins, 
		pay4_attorney_fee = @output_pay4_attorney_fee
end

GO

