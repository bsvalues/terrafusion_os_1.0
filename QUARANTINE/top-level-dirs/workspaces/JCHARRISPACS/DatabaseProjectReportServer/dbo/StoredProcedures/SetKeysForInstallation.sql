CREATE PROCEDURE [dbo].[SetKeysForInstallation]
@InstallationID uniqueidentifier,
@SymmetricKey image = NULL,
@PublicKey image
AS

update [dbo].[Keys]
set [SymmetricKey] = @SymmetricKey, [PublicKey] = @PublicKey
where [InstallationID] = @InstallationID and [Client] = 1

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetKeysForInstallation] TO [RSExecRole]
    AS [dbo];


GO

