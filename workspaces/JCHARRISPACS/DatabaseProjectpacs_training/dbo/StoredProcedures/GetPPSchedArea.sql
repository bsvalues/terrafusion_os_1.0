









CREATE PROCEDURE GetPPSchedArea
 @input_pp_sched_id 	int,
 @input_sup_yr  	numeric(4),
 @input_area		numeric(12,0),
 @unit_price		numeric(14,2) output
AS

declare @area_max	numeric(14,1)
declare @area_price	numeric(14,2)
declare @area_percent	numeric(5,2)

if (@input_area is not null)
begin
	--declare a cursor to be used later
	DECLARE AREA SCROLL CURSOR
	FOR select area_max, area_price, area_percent
    	from pp_schedule_area
    	where pp_sched_id	= @input_pp_sched_id
	and   year		= @input_sup_yr
	and   area_max > 0
	       order by area_max

	OPEN AREA
	FETCH NEXT FROM AREA into @area_max, @area_price, @area_percent

	while (@@FETCH_STATUS = 0)
	begin
		if (@input_area <= @area_max)
		begin
			if (@area_price is not null)
			begin
				select @unit_price = @unit_price + @area_price
			end
			else if (@area_percent is not null)
			begin
				select @unit_price = @unit_price * (@area_percent/100)
			end

			break				
		end

		FETCH NEXT FROM AREA into @area_max, @area_price, @area_percent
	end

	CLOSE AREA
	DEALLOCATE AREA
end

GO

