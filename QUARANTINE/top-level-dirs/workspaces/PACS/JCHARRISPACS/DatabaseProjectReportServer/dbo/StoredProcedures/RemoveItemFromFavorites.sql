CREATE PROCEDURE [dbo].[RemoveItemFromFavorites]
@ItemID uniqueidentifier,
@UserName nvarchar (425),
@UserSid varbinary(85) = NULL,
@AuthType int
AS

DECLARE @UserID uniqueidentifier
EXEC GetUserIDWithNoCreate @UserSid, @UserName, @AuthType, @UserID OUTPUT

DELETE FROM [dbo].[Favorites] WHERE UserID = @UserID AND ItemID = @ItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RemoveItemFromFavorites] TO [RSExecRole]
    AS [dbo];


GO

