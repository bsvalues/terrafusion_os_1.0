CREATE PROCEDURE [dbo].[ListSubscriptionIDs]
AS

SELECT [SubscriptionID]
FROM [dbo].[Subscriptions] WITH (XLOCK, TABLOCK)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ListSubscriptionIDs] TO [RSExecRole]
    AS [dbo];


GO

