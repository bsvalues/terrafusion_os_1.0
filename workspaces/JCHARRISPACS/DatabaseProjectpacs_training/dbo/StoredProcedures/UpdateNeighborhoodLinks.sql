
CREATE PROCEDURE UpdateNeighborhoodLinks

	@input_hood_cd		varchar(10),
	@input_abs_codes	varchar(4000),
	@input_year			int

AS

declare @prop_id	int
declare @sup_num	int
declare @strSQL		varchar(4000)
declare @errno		int

SET @input_abs_codes = REPLACE(@input_abs_codes, '"', '''')

SET @errno = 0

SET XACT_ABORT ON
SET NOCOUNT ON

BEGIN TRANSACTION

DECLARE HoodCursor CURSOR FAST_FORWARD
FOR	SELECT DISTINCT pv.prop_id, pv.sup_num
	FROM property_val as pv
	WITH (NOLOCK)

	INNER JOIN prop_supp_assoc as psa
	WITH (NOLOCK)
	ON pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num

	WHERE pv.prop_val_yr = @input_year
	AND pv.hood_cd = @input_hood_cd

OPEN HoodCursor

FETCH NEXT FROM HoodCursor INTO @prop_id, @sup_num

WHILE @@FETCH_STATUS = 0 AND @errno = 0
BEGIN
	UPDATE property_val
	SET hood_cd = NULL
	WHERE prop_id = @prop_id
	AND prop_val_yr = @input_year
	AND sup_num = @sup_num

	SELECT @errno = @@ERROR
	
	FETCH NEXT FROM HoodCursor INTO @prop_id, @sup_num
END

CLOSE HoodCursor
DEALLOCATE HoodCursor

if len(@input_abs_codes) > 0
begin

	SET @strSQL = 'DECLARE HoodLinkCursor CURSOR FAST_FORWARD '
	SET @strSQL = @strSQL + 'FOR SELECT DISTINCT pv.prop_id, pv.sup_num '
	SET @strSQL = @strSQL + 'FROM property_val as pv '
	SET @strSQL = @strSQL + 'WITH (NOLOCK) '
	
	SET @strSQL = @strSQL + 'INNER JOIN prop_supp_assoc as psa '
	SET @strSQL = @strSQL + 'WITH (NOLOCK) '
	SET @strSQL = @strSQL + 'ON pv.prop_id = psa.prop_id '
	SET @strSQL = @strSQL + 'AND pv.prop_val_yr = psa.owner_tax_yr '
	SET @strSQL = @strSQL + 'AND pv.sup_num = psa.sup_num '
	
	SET @strSQL = @strSQL + 'WHERE pv.prop_val_yr = ' + CONVERT(varchar(4), @input_year) + ' '
	SET @strSQL = @strSQL + 'AND pv.abs_subdv_cd IN ' + @input_abs_codes
	
	exec(@strSQL)
	
	OPEN HoodLinkCursor
	
	FETCH NEXT FROM HoodLinkCursor INTO @prop_id, @sup_num
	
	WHILE @@FETCH_STATUS = 0 AND @errno = 0
	BEGIN
		UPDATE property_val
		SET hood_cd = @input_hood_cd
		WHERE prop_id = @prop_id
		AND prop_val_yr = @input_year
		AND sup_num = @sup_num
	
		SELECT @errno = @@ERROR
	
		FETCH NEXT FROM HoodLinkCursor INTO @prop_id, @sup_num
	END
	
	CLOSE HoodLinkCursor
	DEALLOCATE HoodLinkCursor
end

IF @errno = 0
BEGIN
	COMMIT TRANSACTION
END
ELSE
BEGIN
	ROLLBACK TRANSACTION
END

SET XACT_ABORT OFF

GO

