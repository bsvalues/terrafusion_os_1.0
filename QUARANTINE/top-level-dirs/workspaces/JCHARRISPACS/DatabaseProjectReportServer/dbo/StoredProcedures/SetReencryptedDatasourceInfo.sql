CREATE PROCEDURE [dbo].[SetReencryptedDatasourceInfo]
@DSID uniqueidentifier,
@ConnectionString image = NULL,
@OriginalConnectionString image = NULL,
@UserName image = NULL,
@Password image = NULL,
@CredentialRetrieval int,
@Version int
AS

UPDATE [dbo].[DataSource]
SET
    [ConnectionString] = @ConnectionString,
    [OriginalConnectionString] = @OriginalConnectionString,
    [UserName] = @UserName,
    [Password] = @Password,
    [CredentialRetrieval] = @CredentialRetrieval,
    [Version] = @Version
WHERE [DSID] = @DSID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetReencryptedDatasourceInfo] TO [RSExecRole]
    AS [dbo];


GO

