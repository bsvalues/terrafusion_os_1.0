CREATE PROCEDURE [dbo].[RetrieveExpiredTimerIds]
@ownerID uniqueidentifier = NULL,
@ownedUntil datetime = NULL,
@now datetime
AS
    SELECT uidInstanceID FROM [dbo].[InstanceState]
    WHERE nextTimer<@now AND status<>1 AND status<>3 AND status<>2 -- not blocked and not completed and not terminated and not suspended
        AND ((unlocked=1 AND ownerID IS NULL) OR ownedUntil<GETUTCDATE() )

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RetrieveExpiredTimerIds] TO [state_persistence_users]
    AS [dbo];


GO

