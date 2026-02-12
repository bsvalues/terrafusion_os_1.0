CREATE PROCEDURE [dbo].[DeletePersistedStream]
@SessionID varchar(32),
@Index int
AS

delete from [ReportServerTempDB].dbo.PersistedStream where SessionID = @SessionID and [Index] = @Index

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeletePersistedStream] TO [RSExecRole]
    AS [dbo];


GO

