









CREATE PROCEDURE GetPPSchedUnit
 @input_pp_sched_id 	int,
 @input_sup_yr  	numeric(4),
 @input_unit_count	numeric(12,0),
 @unit_price		numeric(14,2) output
AS

declare @unit_count_max	numeric(12,0)
declare @unit_amt	numeric(14,2)
declare @unit_pct	numeric(5,2)

if (@input_unit_count is not null)
begin
	--declare a cursor to be used later
	DECLARE UNIT_COUNT SCROLL CURSOR
	FOR select unit_count_max, unit_price, unit_percent
    	from pp_schedule_unit_count
    	where pp_sched_id	= @input_pp_sched_id
	and   year		= @input_sup_yr
	and  unit_count_max > 0
	       order by unit_count_max

	OPEN UNIT_COUNT
	FETCH NEXT FROM UNIT_COUNT into @unit_count_max, @unit_amt, @unit_pct

	while (@@FETCH_STATUS = 0)
	begin
		if (@input_unit_count <= @unit_count_max)
		begin
			if (@unit_amt is not null)
			begin
				select @unit_price = @unit_price + @unit_amt
			end
			else if (@unit_pct is not null)
			begin
				select @unit_price = @unit_price * (@unit_pct/100)
			end

			break				
		end

		FETCH NEXT FROM UNIT_COUNT into @unit_count_max, @unit_amt, @unit_pct
	end

	CLOSE UNIT_COUNT
	DEALLOCATE UNIT_COUNT
end

GO

