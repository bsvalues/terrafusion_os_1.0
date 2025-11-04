CREATE PROCEDURE [dbo].[DeleteDataSources]
@ItemID [uniqueidentifier]
AS

DELETE
FROM [DataSource]
WHERE [ItemID] = @ItemID or [SubscriptionID] = @ItemID
DELETE
FROM [ReportServerTempDB].dbo.TempDataSources
WHERE [ItemID] = @ItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteDataSources] TO [RSExecRole]
    AS [dbo];


GO

