CREATE PROCEDURE [dbo].[CleanExpiredContentCache]
AS
    SET DEADLOCK_PRIORITY LOW
    SET NOCOUNT ON
    DECLARE @now as datetime

    SET @now = DATEADD(minute, -1, GETDATE())

    DELETE
    FROM
       [ReportServerTempDB].dbo.[ContentCache]
    WHERE
       ExpirationDate < @now

    SELECT @@ROWCOUNT

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[CleanExpiredContentCache] TO [RSExecRole]
    AS [dbo];


GO

