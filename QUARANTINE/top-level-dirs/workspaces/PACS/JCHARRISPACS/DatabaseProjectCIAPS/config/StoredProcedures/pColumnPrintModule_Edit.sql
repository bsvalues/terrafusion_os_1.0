CREATE PROCEDURE [config].[pColumnPrintModule_Edit]
@ColumnPrintID INT
, @ModuleID INT
, @ByPass BIT = 0
, @Debug BIT = 0
AS
BEGIN

--EXEC config.pColumnPrintModule_Edit @ColumnPrintID = 12, @ModuleID = 1
--EXEC config.pColumnPrintModule_Edit @ColumnPrintID = 12, @ModuleID = NULL

	IF @ByPass = 1
		BEGIN
			GOTO Bypassing;
			RETURN;
		END

	DECLARE @ErrorMsg VARCHAR(500)
	DECLARE @Output TABLE (ColumnPrintID INT, ModuleID INT)
	PRINT @ColumnPrintID
	PRINT @ModuleID

	BEGIN TRY
		MERGE INTO config.columnprint dest USING (SELECT @ColumnPrintID, @ModuleID) AS Source (ColumnPrintID, ModuleID)
		ON dest.columnprintid = source.ColumnPrintID
		WHEN MATCHED THEN 
			UPDATE SET dest.ModuleID = source.ModuleID
		WHEN NOT MATCHED THEN 
			INSERT (ModuleID)
			VALUES (source.ModuleID)
		OUTPUT inserted.columnprintid, Inserted.ModuleID INTO @Output;

	END TRY 
	BEGIN CATCH
		DECLARE @Err VARCHAR(4000)
		SET @Err = ERROR_MESSAGE()
		PRINT @Err
		RAISERROR(@Err,1,16);
	END CATCH

		SELECT ColumnPrintID,
			   ModuleID 
		FROM @Output
		RETURN;

	Bypassing:
	PRINT 'ByPassed'
	RETURN;

END

GO

