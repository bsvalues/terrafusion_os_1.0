
CREATE procedure GetProratePct

@input_effective_dt	datetime,
@input_termination_dt	datetime,
@input_tax_yr		numeric(4),
@output_prorate_pct	numeric(5,4) output

as

declare @beginDay int
declare @endDay int
declare @daysInYear int
declare @prorationDays int

set @daysInYear = datepart(dy, dateadd(year, @input_tax_yr - 1900 + 1, 0) - 1)

set @beginDay = case 
	when @input_effective_dt is null then 1
	when datepart(year, @input_effective_dt) < @input_tax_yr then 1
	when datepart(year, @input_effective_dt) = @input_tax_yr then datepart(dy, @input_effective_dt)
	else 400
end
	
set @endDay = case
	when @input_termination_dt is null then @daysInYear
	when datepart(year, @input_termination_dt) > @input_tax_yr then @daysInYear
	when datepart(year, @input_termination_dt) = @input_tax_yr then datepart(dy, @input_termination_dt)
	else -1
end

set @prorationDays = (@endDay - @beginDay) + 1

set @output_prorate_pct = case
	when @prorationDays > 0 then convert(decimal(7,4), @prorationDays) / convert(decimal(7,4), @daysInYear)
	else 0
end

GO

