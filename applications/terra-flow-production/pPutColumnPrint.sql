CREATE procedure [import].[pPutColumnPrint] 
@FileID int
, @ColumnPrint varchar(4000)
, @ModuleName VARCHAR(50) = ''
AS
BEGIN
DECLARE @columnprintid INT, @ModuleID INT

	SET @columnprintid = (SELECT columnprintid FROM config.columnprint WHERE columnprint_text = @ColumnPrint)
	SET @ModuleID = (SELECT ModuleID FROM config.modules m WHERE m.ModuleName = @ModuleName)

	IF @ModuleID IS NULL
		SET @ModuleID = 1

	IF @columnprintid IS NULL
		BEGIN

			INSERT INTO config.columnprint
			(
			    columnprint_text,
				ModuleID, 
			    created
			)
			SELECT @ColumnPrint, @ModuleID, getdate()
			SET @columnprintid = SCOPE_IDENTITY()

		END
	
	IF @columnprintid IS NULL
		BEGIN	
			THROW 50000, 'No Missing ColumnPrintID exists - post ID lookup',0;
			RETURN	
		END

	If NOT Exists(Select 1 from import.files where FileID = @FileID)
		BEGIN
			THROW 50000, 'No FileID exists',0;
			RETURN
		END

	Update a 
	SET columnprintid = @columnprintid
	from import.files a
	Where FileID = @FileID

	Select ISNULL(@columnprintid,-1)

END

GO

