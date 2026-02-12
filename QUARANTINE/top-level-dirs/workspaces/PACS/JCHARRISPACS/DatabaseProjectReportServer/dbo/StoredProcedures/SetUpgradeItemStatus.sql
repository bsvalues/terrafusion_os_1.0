CREATE PROCEDURE [dbo].[SetUpgradeItemStatus]
@ItemName nvarchar(260),
@Status nvarchar(512)
AS
UPDATE
    [UpgradeInfo]
SET
    [Status] = @Status
WHERE
    [Item] = @ItemName

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetUpgradeItemStatus] TO [RSExecRole]
    AS [dbo];


GO

