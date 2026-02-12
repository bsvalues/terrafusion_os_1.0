CREATE PROCEDURE [dbo].[UpdateSubscriptionStatus]
@SubscriptionID uniqueidentifier,
@Status nvarchar(260)
AS

update Subscriptions set
        [LastStatus] = @Status
where
    [SubscriptionID] = @SubscriptionID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateSubscriptionStatus] TO [RSExecRole]
    AS [dbo];


GO

