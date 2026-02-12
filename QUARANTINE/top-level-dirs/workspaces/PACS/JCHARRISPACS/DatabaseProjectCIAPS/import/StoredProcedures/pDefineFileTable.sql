CREATE procedure [import].[pDefineFileTable] 
@FileID int
, @TableName varchar(4000)
AS
BEGIN
Declare @ReturnFiletableID int;

	If Not Exists(Select 1 from import.files where FileID = @FileID)
		BEGIN
			THROW 50000, 'FileID does not exist',0;
			RETURN
		END

	SET @ReturnFiletableID = (Select filetableid from import.filetables where fileid = @FileID and tablename = @TableName)
	If @ReturnFiletableID IS NOT NULL
		BEGIN
			If Exists(Select * from sys.tables t inner join sys.schemas s on t.schema_id = s.schema_id where s.name + '.' + t.name = @TableName)
				BEGIN
					DECLARE @sql nvarchar(4000) 
						SET @SQL = 'Drop Table ' + @TableName + ';'
						PRINT @SQL
						Exec (@SQL)
					RETURN
				END
		END
	ELSE
	BEGIN
		INSERT INTO import.filetables (fileid, tablename)
		Select @FileID, @TableName
		SET @ReturnFiletableID = SCOPE_IDENTITY();
	END

	Select ISNULL(@ReturnFiletableID,-1)

END

GO

