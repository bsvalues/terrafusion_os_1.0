



CREATE  PROCEDURE GetLandUnitPriceSlopeIntercept

	@input_ls_id		int, 
	@input_ls_yr		numeric(4),
	@input_size  		numeric(18,4), 
	@output_unit_price  numeric(14,2) OUTPUT

AS

declare @ls_range_max numeric(18,4)
declare @ls_slope numeric(14,0)
declare @ls_y_intercept numeric(14,0)

declare @total_land_value numeric(14,0)


	SET @output_unit_price = 0

	/*
	 * First, avoid the cursor by just selecting the first row
	 * where @input_size >= ls_range_max in ls_range_max ascending
	 * order.
	 */	
	
	SELECT TOP 1 @ls_range_max = ls_range_max,
				@ls_slope = ls_slope,
				@ls_y_intercept = ls_y_intercept
	FROM land_sched_si_detail as lssd
	WITH (NOLOCK)
	
	WHERE lssd.ls_id = @input_ls_id
	AND lssd.ls_year = @input_ls_yr
	AND lssd.ls_range_max >= @input_size
	
	ORDER BY lssd.ls_range_max

	/*
	 * Next, must calculate the total land value using the slope-intercept
	 * method:
	 *
	 * y = mx + b
	 * 
	 * Total Land Value = ((slope) * (effective size)) + y_intercept
	 */

	SET @total_land_value = (@ls_slope * @input_size) + @ls_y_intercept
	
	/*
	 * Now, calculate the unit price per acre:
	 *
	 * unit_price = Total Land Value / effective size
	 */

	SET @output_unit_price = @total_land_value / @input_size

GO

