
CREATE FUNCTION fn_GetPPFillYears()
RETURNS @Years TABLE
(
  pp_year int	
)
AS
BEGIN
	DECLARE @appr_yr int
	--SET @input_year_param=@prop_val_yr
	SELECT @appr_yr = appr_yr
	FROM pacs_system

	DECLARE @pp_yr_acquired int
	SET @pp_yr_acquired = @appr_yr
		
	WHILE ( (@appr_yr - @pp_yr_acquired) < 15 )
	BEGIN
		SET @pp_yr_acquired = @pp_yr_acquired - 1
		INSERT INTO @Years (pp_year) VALUES (@pp_yr_acquired) 
	END
	
	RETURN
	
END

GO

