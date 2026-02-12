CREATE PROCEDURE [import].[pLoadFiletoStorage]
AS

DECLARE @queuetbl TABLE (
UID INT IDENTITY(1,1)
, fileid INT
, columnprintid INT
, ColumnOrder INT
, filecolumnname VARCHAR(4000)
, destinationcolumnname VARCHAR(4000)
, tablename VARCHAR(4000)
, desttablename VARCHAR(4000)
)

DECLARE @files TABLE (
UID INT IDENTITY(1,1)
, fileid INT
)

INSERT INTO @queuetbl
(
    fileid,
    columnprintid,
	ColumnOrder,
    filecolumnname,
    destinationcolumnname,
	tablename,
	desttablename 
)
SELECT ft.fileid, f.columnprintid, RANK() OVER(PARTITION BY ft.FileID ORDER BY cpm.ColumnPrintMapid) ColumnOrder, cpm.filecolumnname, cpm.destinationcolumnname, ft.tablename, m.Import_TableName DestTableName
FROM import.filetables ft 
INNER JOIN import.files f ON f.fileid = ft.fileid
INNER JOIN config.columnprint cp ON cp.columnprintid = f.columnprintid
INNER JOIN config.modules m ON m.ModuleID = cp.ModuleID
INNER JOIN config.columnprintmapping cpm ON cpm.columnprintid = cp.columnprintid AND cpm.enabled = 1
--WHERE ft.Processed = ft.created
WHERE NOT EXISTS(SELECT DISTINCT fileid FROM permit.building_import bi WHERE bi.fileid = ft.fileid)
AND cpm.filecolumnname IS NOT NULL	 AND cpm.destinationcolumnname IS NOT NULL	

INSERT INTO @files
(
    fileid
)
SELECT DISTINCT fileid FROM @queuetbl

DECLARE @FileLoops INT, @FileLoopCounter INT
DECLARE @ColumnLoops INT, @ColumnLoopCounter INT
SET @Fileloops = (SELECT COUNT(*) FROM @files)
SET @ColumnLoopCounter = 1
SET @FileLoopCounter = 1

DECLARE @FileID INT, @TableName VARCHAR(4000), @DestTableName varchar(4000), @FileColumnName VARCHAR(4000), @DestColumnName VARCHAR(4000)
	, @execSQL NVARCHAR(4000), @InsertColumnSQL NVARCHAR(4000), @SelectColumnSQL NVARCHAR(4000), @WhereColumnSQL NVARCHAR(4000), @WhereIsDateSQL NVARCHAR(4000)
WHILE @FileLoops >= @FileLoopCounter
BEGIN
--	DECLARE @InsertCount bigint
	SET @FileID = (SELECT FileID FROM @files WHERE UID = @FileLoopCounter)
	SET @TableName = (SELECT DISTINCT TableName FROM @queuetbl WHERE fileid = @FileID )
	SET @DestTableName = (SELECT DISTINCT DestTableName FROM @queuetbl WHERE fileid = @FileID)

	SET @execSQL = 'Insert into ' + @DestTableName + ' ('
	SET @InsertColumnSQL = ''
	SET @WhereColumnSQL = ' Where 1=1 and ('
	SET @WhereIsDateSQL = ''
	SET @SelectColumnSQL = 'Select '
	
	SET @ColumnLoops = (SELECT COUNT(*) FROM @queuetbl WHERE fileid = @FileID)
	SET @ColumnLoopCounter = 1
	WHILE @ColumnLoops >= @ColumnLoopCounter
	BEGIN
		SET @FileColumnName = (SELECT filecolumnname FROM @queuetbl WHERE fileid = @FileID AND ColumnOrder = @ColumnLoopCounter)
		SET @DestColumnName = (SELECT destinationcolumnname FROM @queuetbl WHERE fileid = @FileID AND ColumnOrder = @ColumnLoopCounter)
		
		SET @InsertColumnSQL = @InsertColumnSQL + ' [' + @DestColumnName + ']' + CASE WHEN @ColumnLoops = @ColumnLoopCounter THEN ' ' ELSE ', ' END
		SET @SelectColumnSQL = @SelectColumnSQL + ' [' + @FileColumnName + ']' + CASE WHEN @ColumnLoops = @ColumnLoopCounter THEN ' ' ELSE ', ' END
		SET @WhereColumnSQL = @WhereColumnSQL + ' ISNULL([' + @FileColumnName + '],'''')' + CASE WHEN @ColumnLoops = @ColumnLoopCounter THEN ')' ELSE '+' END
		SET @WhereIsDateSQL = @WhereIsDateSQL + Case when @DestColumnName Like '%Date%' then 'AND ISDATE([' + @FileColumnName + ']) = 1' ELSE '' END

		SET @ColumnLoopCounter = @ColumnLoopCounter + 1
	END
	PRINT @InsertColumnSQL
	PRINT @SelectColumnSQL
	SET @InsertColumnSQL = @InsertColumnSQL + ', fileid ) '
	SET @SelectColumnSQL = @SelectColumnSQL + ', ' + STR(@FileID)
	SET @WhereColumnSQL = @WhereColumnSQL + ' <> '''''
	SET @execSQL = @execSQL + @InsertColumnSQL + @SelectColumnSQL + ' FROM ' + @TableName + @WhereColumnSQL  + @WhereIsDateSQL
	 
	BEGIN TRY
		PRINT @execSQL
		EXEC (@execSQL)

		UPDATE a 
		SET Processed = GETDATE()
		, a.processedrecordcount = @@ROWCOUNT
		FROM import.filetables a 
		WHERE a.fileid = @FileID 
	END TRY

	BEGIN CATCH
		PRINT ERROR_NUMBER()
		PRINT ERROR_MESSAGE()
		GOTO CaughtExit;
	END CATCH
	


	CaughtExit:

SET @FileLoopCounter = @FileLoopCounter + 1
END

GO

