


CREATE  procedure GetSalesRatio

as


declare @chg_of_owner_id	int
declare @land_only_sale		bit
declare @sale_dt		datetime
declare @sale_price		numeric(14)
declare @land_value		numeric(14)
declare @market_value		numeric(14)
declare @living_area_sqft	numeric(14)

declare @sale_ratio		numeric(18,5)
declare @sale_ratio_land 	numeric(18,5)
declare @sale_avg_price_sqft	numeric(18,5)
declare @avg_price_sqft		numeric(18,5)
declare @land_market_ratio	numeric(18,5)


DECLARE sales_cursor CURSOR FAST_FORWARD
FOR	select chg_of_owner_id,
	       sale_dt,
	       IsNull(sale_price, 0)
	from #sales

open sales_cursor
fetch next from sales_cursor into @chg_of_owner_id, @sale_dt, @sale_price

while (@@FETCH_STATUS = 0)
begin
	
	select @land_value 	 = sum(IsNull(land_value, 0)),
	       @market_value 	 = sum(IsNull(market_value,0)),
	       @living_area_sqft =     sum(IsNull(living_area_sqft, 0))
	from #sales_prop
	where chg_of_owner_id = @chg_of_owner_id

	select @land_only_sale = land_only_sale
	from sale
	where chg_of_owner_id = @chg_of_owner_id
	
	if (@sale_price > 0)
	begin
		set @sale_ratio         = @market_value/@sale_price
		set @sale_ratio_land = @land_value/@sale_price
	end
	else
	begin
		set @sale_ratio      = 0
		set @sale_ratio_land = 0
	end

	if (@land_only_sale = 1)
	begin
		set @sale_ratio = @sale_ratio_land
	end

	if (@market_value > 0)
	begin
		set @land_market_ratio = @land_value/@market_value
	end
	else
	begin
		set @land_market_ratio = 0
	end

	if (@living_area_sqft > 0)
	begin
		set @sale_avg_price_sqft = @sale_price/@living_area_sqft
		set @avg_price_sqft	 = @market_value/@living_area_sqft
	end
	else
	begin
		set @sale_avg_price_sqft = 0
		set @avg_price_sqft      = 0
	end

	update #sales 
	set 	sale_ratio	    = @sale_ratio,
		sale_ratio_land     = @sale_ratio_land,
		sale_avg_price_sqft = @sale_avg_price_sqft,
		avg_price_sqft	    = @avg_price_sqft,
		land_value	    = @land_value,
		market_value	    = @market_value,
		living_area_sqft    = @living_area_sqft,
	             land_market_ratio = @land_market_ratio
	where chg_of_owner_id = @chg_of_owner_id


	fetch next from sales_cursor into @chg_of_owner_id, @sale_dt, @sale_price
end

close sales_cursor
deallocate sales_cursor

GO

