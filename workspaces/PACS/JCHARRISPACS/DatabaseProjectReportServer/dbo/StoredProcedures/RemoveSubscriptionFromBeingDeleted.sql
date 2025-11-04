CREATE PROCEDURE [dbo].[RemoveSubscriptionFromBeingDeleted]
@SubscriptionID uniqueidentifier
AS
delete from [SubscriptionsBeingDeleted] where SubscriptionID = @SubscriptionID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RemoveSubscriptionFromBeingDeleted] TO [RSExecRole]
    AS [dbo];


GO

