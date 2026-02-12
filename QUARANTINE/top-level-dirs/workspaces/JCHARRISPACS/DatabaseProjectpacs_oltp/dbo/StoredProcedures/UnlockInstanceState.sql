Create Procedure [dbo].[UnlockInstanceState]
@uidInstanceID uniqueidentifier,
@ownerID uniqueidentifier = NULL
As

SET TRANSACTION ISOLATION LEVEL READ COMMITTED
set nocount on

		Update [dbo].[InstanceState]  
		Set ownerID = NULL,
			ownedUntil = NULL
		Where uidInstanceID = @uidInstanceID AND ((ownerID = @ownerID AND ownedUntil>=GETUTCDATE()) OR (ownerID IS NULL AND @ownerID IS NULL ))

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UnlockInstanceState] TO [state_persistence_users]
    AS [dbo];


GO

