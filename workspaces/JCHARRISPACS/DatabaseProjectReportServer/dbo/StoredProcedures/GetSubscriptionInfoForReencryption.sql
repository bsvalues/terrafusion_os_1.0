CREATE PROCEDURE [dbo].[GetSubscriptionInfoForReencryption]
@SubscriptionID as uniqueidentifier
AS

SELECT [DeliveryExtension], [ExtensionSettings], [Version]
FROM [dbo].[Subscriptions]
WHERE [SubscriptionID] = @SubscriptionID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetSubscriptionInfoForReencryption] TO [RSExecRole]
    AS [dbo];


GO

