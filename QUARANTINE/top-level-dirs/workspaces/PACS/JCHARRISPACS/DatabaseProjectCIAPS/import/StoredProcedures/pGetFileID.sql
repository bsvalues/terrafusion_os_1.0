create procedure [import].[pGetFileID] 
@FileFullPath varchar(4000)
, @FileName varchar(4000)
, @FileCreatedDate datetime
as 
BEGIN

Declare @FileID as int
SET @FileID = (Select fileid from import.files where filelocation = @FileFullPath)

If @FileID IS NULL 
	BEGIN
		INSERT INTO import.files (filelocation, filename, locationcreated, firstdate, recentdate)
		Select @FileFullPath, @FileName, @FileCreatedDate, getdate(), getdate()
		Set @FileID = SCOPE_IDENTITY()
	END

	PRINT @FileID
	Select ISNULL(@FileID,-1)
		Return
	
END

GO

