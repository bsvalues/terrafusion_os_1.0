CREATE PROCEDURE [dbo].[GetAnnouncedKey]
@InstallationID uniqueidentifier
AS

select PublicKey, MachineName, InstanceName
from Keys
where InstallationID = @InstallationID and Client = 1

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetAnnouncedKey] TO [RSExecRole]
    AS [dbo];


GO

