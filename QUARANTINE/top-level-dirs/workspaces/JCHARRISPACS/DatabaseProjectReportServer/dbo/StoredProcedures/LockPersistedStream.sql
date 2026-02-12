CREATE PROCEDURE [dbo].[LockPersistedStream]
@SessionID varchar(32),
@Index int
AS

SELECT [Index] FROM [ReportServerTempDB].dbo.PersistedStream WITH (XLOCK) WHERE SessionID = @SessionID AND [Index] = @Index

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[LockPersistedStream] TO [RSExecRole]
    AS [dbo];


GO

