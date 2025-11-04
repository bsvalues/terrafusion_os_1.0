



CREATE PROCEDURE RecalcVITPersonalProperty
 @input_prop_id 	int,
 @input_sup_yr  	numeric(4),
 @input_sup_num 	int,
 @input_sale_id		int,
 @input_rounding_factor	numeric(1),
 @output_vit_sales      numeric(14) output
AS

--VIT Sales variables
declare @vit_sales_id	int
declare @prop_id	int
declare @year		numeric(4,0)
declare @month		numeric(2,0)
declare @total_sales	numeric(18,2)

--Stored Procedure variables
declare @num_of_months_with_sales	numeric(2,0)
declare @total_sales_amount		numeric(18,2)
declare @appraised_val			numeric(14,0)

--Initialize variables
select @num_of_months_with_sales = 0
select @total_sales_amount 	 = 0
select @appraised_val		 = 0

--Declare a cursor so we can go through all twelve months
DECLARE VIT_SALES SCROLL CURSOR
FOR select total_sales, month
from  vit_sales
where prop_id	  = @input_prop_id
and   year 	  = @input_sup_yr - 1

OPEN VIT_SALES
FETCH NEXT FROM VIT_SALES into @total_sales, @month

while (@@FETCH_STATUS = 0)
begin
	if (@total_sales is not null)
	begin
		select @total_sales_amount 	 = @total_sales_amount + @total_sales
		select @num_of_months_with_sales = @num_of_months_with_sales + 1	
	end

	update vit_sales set recalc_date = GetDate()
	where prop_id	  = @input_prop_id
	and   year 	  = @input_sup_yr
	and   month	  = @month

	FETCH NEXT FROM VIT_SALES into	@total_sales, @month
end

CLOSE VIT_SALES
DEALLOCATE VIT_SALES


--Update the property_val table with the total_sales_amount/num_of_months_with_sales
if (@num_of_months_with_sales > 0)
begin
	set @output_vit_sales  = round((@total_sales_amount/@num_of_months_with_sales), @input_rounding_factor)
end
else
begin	
	set @output_vit_sales = 0
end

GO

