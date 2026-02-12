


CREATE PROCEDURE GetSlopeInterceptAdjFactors

	@input_prop_id int,
	@input_year int,
	@input_sup_num int,
	@input_sale_id int,
	@input_imprv_id int,
	@input_imprv_det_id int,
	@input_imprv_type_cd varchar(10),
	@output_deprec_factor numeric(5,2) OUTPUT,
	@output_size_adj_factor numeric(5,2) OUTPUT,
	@output_slope_intercept_flag bit OUTPUT

AS
	SET @output_deprec_factor = 0
	SET @output_size_adj_factor = 0
	SET @output_slope_intercept_flag = 0

declare @slope numeric(14,5)
declare @y_intercept numeric(14,5)
declare @hood_cd varchar(20)
declare @total_living_area numeric(18,1)
declare @imprv_det_type_cd varchar(10)
declare @condition_cd varchar(5)
declare @heat_ac_cd varchar(75)
declare @age numeric(4,0)
declare @temp_deprec_factor numeric(14,8)

	/*
	 * First, get the neighborhood code
	 */

	SELECT @hood_cd = hood_cd
	FROM property_val
	WITH (NOLOCK)
	WHERE prop_id = @input_prop_id
	AND prop_val_yr = @input_year
	AND sup_num = @input_sup_num


	/*
	 * Next, retrieve improvement detail information
	 */

	SELECT @condition_cd = ISNULL(condition_cd,''),
			@age = ISNULL(psy.depreciation_yr, prop_val_yr) - imprv_detail.depreciation_yr
	FROM imprv_detail
	WITH (NOLOCK)
	LEFT OUTER JOIN pacs_system_year as psy
	ON imprv_detail.prop_val_yr = psy.pacs_yr
	WHERE prop_id = @input_prop_id
	AND prop_val_yr = @input_year
	AND sup_num = @input_sup_num
	AND sale_id = @input_sale_id
	AND imprv_id = @input_imprv_id
	AND imprv_det_id = @input_imprv_det_id

	IF EXISTS(SELECT * FROM slope_intercept_deprec
				WHERE sid_hood_cd = @hood_cd
				AND sid_type_cd = @input_imprv_type_cd
				AND sid_year = @input_year)
	BEGIN
		SET @output_slope_intercept_flag = 1

		/*
		 * Next, must retrieve the heat_ac_cd for use with the
		 * slope_intercept_std_detail table
		 */
	
		SELECT TOP 1 @heat_ac_cd = i_attr_val_cd
		FROM imprv_attr
		WITH (NOLOCK)
		WHERE imprv_id = @input_imprv_id
		AND prop_id = @input_prop_id
		AND imprv_det_id = @input_imprv_det_id
		AND prop_val_yr = @input_year
		AND sup_num = @input_sup_num
		AND sale_id = @input_sale_id
		AND i_attr_val_id = 9			-- 9 = heating/air conditioning
	
		IF @hood_cd IS NOT NULL
		BEGIN
			SELECT TOP 1 @slope = slope,
						@y_intercept = y_intercept
			FROM slope_intercept_std_detail
			WITH (NOLOCK)
			
			WHERE sid_hood_cd = @hood_cd
			AND sid_type_cd = @input_imprv_type_cd
			AND sid_year = @input_year
			AND condition_cd = @condition_cd
			AND heat_ac_cd = @heat_ac_cd
			AND age_max >= @age
			
			ORDER BY age_max

			/*
			 * If it didn't find any matches, it's either not set up in the
			 * standard table, or this is a "normal" calculation.
			 */

			IF @@ROWCOUNT > 0
			BEGIN
				/*
				 * Now calculate the depreciated percentage.  This is done like so:
				 *
				 * 1. Take the slope and intercept acquired from the above statement
				 * 2. Use y = m(x) + b formula
				 *   	where
				 *
				 * 		y = rate of depreciation per year
				 *		m = slope
				 *		x = age
				 *		b = y-intercept
				 */
		
				SET @temp_deprec_factor = (@slope * @age) + @y_intercept

				/*
				 * This is now for one year.  So multiply this by the age of the
				 * improvement detail.
				 */
		
				SET @temp_deprec_factor = @temp_deprec_factor * @age

				/*
				 * Subtract this from 100%
				 */

				SET @temp_deprec_factor = 1 - @temp_deprec_factor
				SET @temp_deprec_factor = @temp_deprec_factor * 100

				/*
				 * Now round it
				 */

				SET @output_deprec_factor = round(@temp_deprec_factor, 0)
			END
			ELSE
			BEGIN
				SET @output_deprec_factor = 100
			END
	
			/*
			 * Now do the special size adjustment.
			 */
	
			/*
			 * Retrieve the total living area.  This is not the same as the
			 * total living area in RecalcImpValue.
			 *
			 * First, must use the imprv_det_type_cd to look in the imprv_det_type
			 * table and see if comp_sales_main_area_flag = 'T'.  If it is, then
			 * add up all the imprv_detail.imprv_det_areas.
			 */
		
			SELECT @total_living_area = SUM(ISNULL(imprv_det_area,0))
			FROM imprv_detail as id
			WITH (NOLOCK)
		
			INNER JOIN imprv_det_type as idt
			WITH (NOLOCK)
			ON id.imprv_det_type_cd = idt.imprv_det_type_cd
			AND idt.comp_sales_main_area_flag = 'T'
		
			WHERE prop_id = @input_prop_id
			AND prop_val_yr = @input_year
			AND sup_num = @input_sup_num
			AND imprv_id = @input_imprv_id
			AND sale_id = @input_sale_id
	
			/*
			 * Get the adjustment factor based on the total living area
			 */
	
			SELECT TOP 1 @output_size_adj_factor = ISNULL(adj_pct * 100, 0)
			FROM slope_intercept_size_detail
			WITH (NOLOCK)
	
			WHERE sid_hood_cd = @hood_cd
			AND sid_type_cd = @input_imprv_type_cd
			AND sid_year = @input_year
			AND living_area_max >= @total_living_area
	
			ORDER BY living_area_max
	
			IF @@ROWCOUNT < 1
			BEGIN
				SET @output_size_adj_factor = 0
			END
		END
	END
	ELSE
	BEGIN
		SET @output_deprec_factor = 100
	END

GO

