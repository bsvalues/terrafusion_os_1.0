CREATE PROCEDURE [dbo].[ListInstallations]
AS

SELECT
    [MachineName],
    [InstanceName],
    [InstallationID],
    CASE WHEN [SymmetricKey] IS null THEN 0 ELSE 1 END
FROM [dbo].[Keys]
WHERE [Client] = 1

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ListInstallations] TO [RSExecRole]
    AS [dbo];


GO

