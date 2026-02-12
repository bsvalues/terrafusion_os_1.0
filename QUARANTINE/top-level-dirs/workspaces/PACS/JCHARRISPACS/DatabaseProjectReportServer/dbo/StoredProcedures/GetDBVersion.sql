
    CREATE PROCEDURE [dbo].[GetDBVersion]
    @DBVersion nvarchar(32) OUTPUT
    AS
    SET @DBVersion = (select top(1) [ServerVersion] from [dbo].[ServerUpgradeHistory] ORDER BY [UpgradeID] DESC)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDBVersion] TO [RSExecRole]
    AS [dbo];


GO

