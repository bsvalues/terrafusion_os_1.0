CREATE PROCEDURE [dbo].[GetUpgradeItems]
AS
SELECT
    [Item],
    [Status]
FROM
    [UpgradeInfo]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUpgradeItems] TO [RSExecRole]
    AS [dbo];


GO

