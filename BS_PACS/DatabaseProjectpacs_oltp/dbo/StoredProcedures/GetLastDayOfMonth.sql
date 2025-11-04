


CREATE   PROCEDURE GetLastDayOfMonth
@input_month      		int,
@input_year			int,
@output_last_day_month      	int OUTPUT

AS

declare @quotient	int
declare @leap_year	int

if (@input_month = 1) OR (@input_month = 3) OR (@input_month = 5) OR (@input_month =7) OR
   (@input_month = 8) OR (@input_month = 10) OR (@input_month = 12)
begin
	select @output_last_day_month = 31
end
else if (@input_month = 4) OR (@input_month = 6) OR (@input_month = 9) OR (@input_month = 11)
begin
	select @output_last_day_month = 30
end
else if (@input_month = 2)
begin	
	select @leap_year = 0

 	/* check for leap year */
	if (@input_year%4 = 0) AND (@input_year%100 != 0)
	begin
		select @leap_year = 1
	end
	else if (@input_year%4 = 0) AND (@input_year%100 = 0)
	begin
		select @quotient = @input_year/100

		if (@quotient%4 = 0)
		begin
			select @leap_year = 1
		end
	end

	if (@leap_year = 1)
	begin
		select @output_last_day_month = 29
	end
	else
	begin	
		select @output_last_day_month = 28
	end
end

GO

