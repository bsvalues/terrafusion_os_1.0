CREATE PROCEDURE [dbo].[GetUserServiceTokenForReencryption]
@UserID as uniqueidentifier
AS

SELECT [ServiceToken]
FROM [dbo].[Users]
WHERE [UserID] = @UserID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUserServiceTokenForReencryption] TO [RSExecRole]
    AS [dbo];


GO

