







CREATE  procedure  GetQBillPenaltyInterest 
@input_bill_id		int, 
@input_show_output	int, 
@input_delq_roll		char(1), 
@input_effective_date	datetime,    
@output_pay1_penalty_mno  varchar(100) OUTPUT, 
@output_pay1_penalty_ins  varchar(100) OUTPUT,
@output_pay1_interest_mno varchar(100) OUTPUT,
@output_pay1_interest_ins varchar(100) OUTPUT, 
@output_pay1_attorney_fee varchar(100) OUTPUT,
@output_pay2_penalty_mno  varchar(100) OUTPUT, 
@output_pay2_penalty_ins  varchar(100) OUTPUT,
@output_pay2_interest_mno varchar(100)  OUTPUT,
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


if (@input_delq_roll = 'F')
begin
	select 	@bill_adj_mno = bill_adj_m_n_o,
		@bill_adj_ins = bill_adj_i_n_s,
		@pay1_due	      = pay1_amt - pay1_paid,
		@pay2_due	      = pay2_amt - pay2_paid,
		@pay3_due	      = pay3_amt - pay3_paid,
		@pay4_due	      = pay4_amt - pay4_paid,
		@pay1_due_dt	      = pay1_due_dt,
		@pay2_due_dt	      = pay2_due_dt,
		@pay3_due_dt	      = pay3_due_dt,
		@pay4_due_dt	      = pay4_due_dt,
		@entity_id                = entity_id,
		@sup_tax_yr	      = sup_tax_yr,
		@adjustment_code = adjustment_code
	from bill
	where bill_id = @input_bill_id
end
else
begin
	select 	@bill_adj_mno = bill_adj_m_n_o,
		@bill_adj_ins = bill_adj_i_n_s,
		@pay1_due	      = pay1_amt - pay1_paid,
		@pay2_due	      = pay2_amt - pay2_paid,
		@pay3_due	      = pay3_amt - pay3_paid,
		@pay4_due	      = pay4_amt - pay4_paid,
		@pay1_due_dt	      = pay1_due_dt,
		@pay2_due_dt	      = pay2_due_dt,
		@pay3_due_dt	      = pay3_due_dt,
		@pay4_due_dt	      = pay4_due_dt,
		@entity_id                = entity_id,
		@sup_tax_yr	      = sup_tax_yr,
		@adjustment_code = adjustment_code
	from delq_roll_bill
	where bill_id = @input_bill_id
end

select @mno_rate = (@bill_adj_mno)/(@bill_adj_mno + @bill_adj_ins)

if exists (select * from tax_rate where entity_id = @entity_id
and     tax_rate_yr = @sup_tax_yr)
begin
	select 	@attorney_fee_dt	 = attorney_fee_dt,
           		@attorney_fee_pct = attorney_fee_pct
	from tax_rate
	where entity_id = @entity_id
	and     tax_rate_yr = @sup_tax_yr
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
		select    @use_penalty           	= IsNull(use_penalty, 'F'), 
			@adj_penalty_rate      	= IsNull(penalty_rate, 0),
			@use_interest          	= IsNull(use_interest, 'F'), 
			@adj_interest_rate     	= IsNull(interest_rate, 0), 
			@use_attorney_fee     	=IsNull(use_attorney_fee, 'F'), 
			@adj_attorney_fee_rate 	= IsNull(attorney_fee_rate, 0)
			
 		from bill_adjust_code
		where adjust_cd = @adjustment_code
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
		select @penalty_rate = 12
	end

	if (@use_interest = 'T')
	begin	
		select @interest_rate = @adj_interest_rate
	end
	else
	begin
		select @interest_rate = @diff_month
	end

	select @output_pay1_penalty_mno  = convert(varchar(100), convert(numeric(14,2), ((@pay1_due * @mno_rate) * @penalty_rate/100)))
	select @output_pay1_penalty_ins  = convert(varchar(100),  convert(numeric(14,2), ((@pay1_due - (@pay1_due * @mno_rate)) * @penalty_rate/100)))
	select @output_pay1_interest_mno = convert(varchar(100),  convert(numeric(14,2), ((@pay1_due * @mno_rate) * @interest_rate/100)))
	select @output_pay1_interest_ins = convert(varchar(100),  convert(numeric(14,2), ((@pay1_due - (@pay1_due * @mno_rate)) * @interest_rate/100)))

	if (@attorney_fee_dt is not null and @attorney_fee_dt > @pay1_due_dt and @input_effective_date >= @attorney_fee_dt)
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
		select @penalty_rate = 12
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
	
	
	if (@attorney_fee_dt is not null and @attorney_fee_dt > @pay2_due_dt and @input_effective_date >= @attorney_fee_dt)
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
		select @penalty_rate = 12
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
	
	
	if (@attorney_fee_dt is not null and @attorney_fee_dt > @pay3_due_dt and @input_effective_date >= @attorney_fee_dt)
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
		select @penalty_rate = 12
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
		
	if (@attorney_fee_dt is not null and @attorney_fee_dt > @pay4_due_dt and @input_effective_date >= @attorney_fee_dt)
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

