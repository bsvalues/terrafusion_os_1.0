CREATE PROCEDURE [dbo].[SetMachineName]
@MachineName nvarchar(256),
@InstallationID uniqueidentifier
AS

UPDATE [dbo].[Keys]
SET MachineName = @MachineName
WHERE [InstallationID] = @InstallationID and [Client] = 1

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetMachineName] TO [RSExecRole]
    AS [dbo];


GO

