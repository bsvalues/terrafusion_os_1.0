CREATE PROCEDURE [config].[pColumnMapping_Edit]
@ColumnPrintID INT
, @FileColumnName VARCHAR(500)
, @DestColumnName VARCHAR(500)
, @ByPass BIT = 0
, @Debug BIT = 0
AS
BEGIN

	IF @ByPass = 1 OR ISNULL(@DestColumnName,'') = ''
		BEGIN
			GOTO Bypassing;
			RETURN;
		END
	DECLARE @ErrorMsg VARCHAR(500)
	DECLARE @Output TABLE (ColumnPrintMapID INT, ColumnPrintID INT, FileColumnName VARCHAR(500), DestColumnName VARCHAR(500))

	BEGIN TRY
		MERGE INTO config.columnprintmapping dest USING (SELECT @ColumnPrintID, @FileColumnName, @DestColumnName) AS Source (ColumnPrintID, FileColumnName, DestColumnName)
		ON dest.columnprintid = source.ColumnPrintID AND dest.filecolumnname = source.FileColumnName
		WHEN MATCHED THEN 
		UPDATE SET dest.destinationcolumnname = source.DestColumnName, dest.Updated = GETDATE(), dest.enabled = CASE WHEN dest.enabled = 1 THEN 0 ELSE 1 END
		WHEN NOT MATCHED THEN 
		INSERT (columnprintid, filecolumnname, destinationcolumnname)
		VALUES (source.ColumnPrintID, source.FileColumnName, source.DestColumnName)
		OUTPUT Inserted.columnprintmapid, inserted.columnprintid, Inserted.filecolumnname, Inserted.destinationcolumnname INTO @Output;

		----FOR NOW - All ColumnPrints are Building Permits
		--UPDATE cp 
		--SET cp.ModuleID = 1 -- Building Permits
		--FROM config.columnprint cp 
		--WHERE cp.columnprintid = @ColumnPrintID
		--AND cp.Columnprintid IS NULL

	END TRY 
	BEGIN CATCH
		DECLARE @Err VARCHAR(4000)
		SET @Err = ERROR_MESSAGE()
		PRINT @Err
		RAISERROR(@Err,1,16);
	END CATCH

		SELECT ColumnPrintMapID,
			   ColumnPrintID,
			   FileColumnName,
			   DestColumnName
		FROM @Output

		RETURN;

	Bypassing:
	PRINT 'ByPassed'
	RETURN;

END

GO

