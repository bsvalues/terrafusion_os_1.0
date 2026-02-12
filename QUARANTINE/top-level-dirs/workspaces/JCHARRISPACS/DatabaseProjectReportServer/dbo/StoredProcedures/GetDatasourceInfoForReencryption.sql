CREATE PROCEDURE [dbo].[GetDatasourceInfoForReencryption]
@DSID as uniqueidentifier
AS

SELECT
    [ConnectionString],
    [OriginalConnectionString],
    [UserName],
    [Password],
    [CredentialRetrieval],
    [Version]
FROM [dbo].[DataSource]
WHERE [DSID] = @DSID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDatasourceInfoForReencryption] TO [RSExecRole]
    AS [dbo];


GO

