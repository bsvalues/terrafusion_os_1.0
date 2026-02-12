CREATE PROCEDURE [dbo].[GetDataModelDatasourceForReencryption]
@DSID as bigint
AS

SELECT
    [ConnectionString],
    [Username],
    [Password]
FROM [dbo].[DataModelDataSource]
WHERE [DSID] = @DSID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDataModelDatasourceForReencryption] TO [RSExecRole]
    AS [dbo];


GO

