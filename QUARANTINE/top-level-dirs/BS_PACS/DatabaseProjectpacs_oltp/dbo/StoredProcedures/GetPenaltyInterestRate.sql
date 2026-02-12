


CREATE     procedure  GetPenaltyInterestRate
@input_due_year		int, 
@input_pay_type		varchar(5),
@input_deferral_cd	varchar(1),
@input_deferral_expired varchar(1),
@output_penalty_rate	int output

as

-- Use this script to determine the penalty interest rate for late installments based on the payment due year


-- 2006.01.20 - Jeremy Smith - HS 31664 - Interest Change for Late Installments
-- The penalty rate before   2006 was 12%
-- The penalty rate starting 2006 is   6%
-- If the bill is due in 2006 or later, use the new rate of 6%, otherwise use 12%

-- 2006.06.15 - Jeremy Smith - HS 27592 - Add deferral and payment type logic
-- In addition, the penalty rate with a deferral that is not expired is 0,
-- otherwise, the rate is whatever we calculated it as before


-- This logic determines the penalty rate:
-- If deferral and its not expired : 0%
-- otherwise,
-- If quarterly and <  2006        : 12%
-- If quarterly and >= 2006        :  6%
-- If half/other                   : 12%
	
if @input_deferral_cd = 'T' AND @input_deferral_expired <> 'T'
begin
	set @output_penalty_rate = 0
end
else
begin

	if ( @input_pay_type = 'Q' )
	begin
		if ( @input_due_year < 2006 )
		begin
		    set @output_penalty_rate = 12
		end
		else
		begin
		    set @output_penalty_rate = 6
		end
	end
	else
	begin
		set @output_penalty_rate = 12
	end

end

GO

