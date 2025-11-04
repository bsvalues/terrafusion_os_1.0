CREATE PROCEDURE [dbo].[DeleteSubscription]
@SubscriptionID uniqueidentifier
AS
    -- Delete the subscription
    DELETE FROM [Subscriptions] WHERE [SubscriptionID] = @SubscriptionID
    -- Delete it from the SubscriptionsBeingDeleted
    EXEC RemoveSubscriptionFromBeingDeleted @SubscriptionID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteSubscription] TO [RSExecRole]
    AS [dbo];


GO

