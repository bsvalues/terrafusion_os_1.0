CREATE PROCEDURE [dbo].[UpdateDataModelDataSourceByID]
    @DataSourceID UNIQUEIDENTIFIER,
    @AuthType VARCHAR(100),
    @ConnectionString VARBINARY(MAX) = NULL,
    @Username VARBINARY(MAX) = NULL,
    @Password VARBINARY(MAX) = NULL,
    @ModifiedByID UNIQUEIDENTIFIER
AS

BEGIN
UPDATE [dbo].[DataModelDataSource]
SET
    [AuthType] = @AuthType,
    [ConnectionString] = @ConnectionString,
    [Username] = @Username,
    [Password] = @Password,
    [ModifiedByID] = @ModifiedByID,
    [ModifiedDate] = GETDATE()
WHERE [DataSourceID] = @DataSourceID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateDataModelDataSourceByID] TO [RSExecRole]
    AS [dbo];


GO

