CREATE PROCEDURE [dbo].[DeleteAlertSubscription]
    @AlertSubscriptionID bigint
AS
BEGIN
    DELETE FROM [AlertSubscribers] WHERE
    AlertSubscriptionID = @AlertSubscriptionID
END

GO

