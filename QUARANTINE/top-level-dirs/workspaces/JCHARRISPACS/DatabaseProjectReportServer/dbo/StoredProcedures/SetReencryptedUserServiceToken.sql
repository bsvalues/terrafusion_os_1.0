CREATE PROCEDURE [dbo].[SetReencryptedUserServiceToken]
@UserID uniqueidentifier,
@ServiceToken ntext
AS

UPDATE [dbo].[Users]
SET [ServiceToken] = @ServiceToken
WHERE [UserID] = @UserID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetReencryptedUserServiceToken] TO [RSExecRole]
    AS [dbo];


GO

