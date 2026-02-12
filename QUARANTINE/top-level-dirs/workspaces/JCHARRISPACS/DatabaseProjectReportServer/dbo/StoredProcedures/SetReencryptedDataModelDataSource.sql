CREATE PROCEDURE [dbo].[SetReencryptedDataModelDataSource]
    @DSID bigint,
    @ConnectionString varbinary(max) = null,
    @Username varbinary(max) = null,
    @Password varbinary(max) = null
AS

UPDATE [dbo].[DataModelDataSource]
SET
    [ConnectionString] = @ConnectionString,
    [Username] = @Username,
    [Password] = @Password
WHERE [DSID] = @DSID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetReencryptedDataModelDataSource] TO [RSExecRole]
    AS [dbo];


GO

