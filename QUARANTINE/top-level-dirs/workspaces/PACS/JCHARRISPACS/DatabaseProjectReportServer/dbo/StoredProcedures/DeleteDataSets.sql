CREATE PROCEDURE [dbo].[DeleteDataSets]
@ItemID [uniqueidentifier]
AS
DELETE
FROM [DataSets]
WHERE [ItemID] = @ItemID
DELETE
FROM [ReportServerTempDB].dbo.TempDataSets
WHERE [ItemID] = @ItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteDataSets] TO [RSExecRole]
    AS [dbo];


GO

