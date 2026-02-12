CREATE PROCEDURE [dbo].[GetSubscriptionsForUpgrade]
@CurrentVersion int
AS
SELECT
    [SubscriptionID]
FROM
    [Subscriptions]
WHERE
    [Version] != @CurrentVersion

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetSubscriptionsForUpgrade] TO [RSExecRole]
    AS [dbo];


GO

