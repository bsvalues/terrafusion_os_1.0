CREATE PROCEDURE [dbo].[CreateNewActiveSubscription]
@ActiveID uniqueidentifier,
@SubscriptionID uniqueidentifier
AS


-- Insert into the activesubscription table
insert into [ActiveSubscriptions]
    (
    [ActiveID],
    [SubscriptionID],
    [TotalNotifications],
    [TotalSuccesses],
    [TotalFailures]
    )
values
    (
    @ActiveID,
    @SubscriptionID,
    NULL,
    0,
    0
    )

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[CreateNewActiveSubscription] TO [RSExecRole]
    AS [dbo];


GO

