CREATE PROCEDURE [dbo].[GetDataSourceForUpgrade]
@CurrentVersion int
AS
SELECT
    [DSID]
FROM
    [DataSource]
WHERE
    [Version] != @CurrentVersion

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDataSourceForUpgrade] TO [RSExecRole]
    AS [dbo];


GO

