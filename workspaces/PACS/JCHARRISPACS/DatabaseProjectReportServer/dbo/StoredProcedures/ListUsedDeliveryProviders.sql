CREATE PROCEDURE [dbo].[ListUsedDeliveryProviders]
AS
select distinct [DeliveryExtension] from Subscriptions where [DeliveryExtension] <> ''

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ListUsedDeliveryProviders] TO [RSExecRole]
    AS [dbo];


GO

