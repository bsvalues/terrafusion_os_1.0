


CREATE PROCEDURE GetImprvSlopeInterceptAddFactor

	@input_prop_id int,
	@input_year int,
	@input_sup_num int,
	@input_type_cd varchar(10),
	@input_condition_cd	varchar(5),
	@output_add_factor numeric(14,4) OUTPUT

AS

declare @hood_cd varchar(10)


	SET @output_add_factor = 0

	/*
	 * First determine the neighborhood code for the property
	 */

	SELECT @hood_cd = hood_cd
	FROM property_val
	WITH (NOLOCK)
	WHERE prop_id = @input_prop_id
	AND prop_val_yr = @input_year
	AND sup_num = @input_sup_num

	IF @hood_cd IS NOT NULL
	BEGIN
		SELECT TOP 1 @output_add_factor = eif
		FROM slope_intercept_eif_detail
		WITH (NOLOCK)
		
		WHERE sid_hood_cd = @hood_cd
		AND sid_type_cd = @input_type_cd
		AND sid_year = @input_year
		AND condition_cd = @input_condition_cd

		IF @@ROWCOUNT = 0
		BEGIN
			SET @output_add_factor = 1
		END
	END
	ELSE
	BEGIN
		SET @output_add_factor = 1
	END

GO

