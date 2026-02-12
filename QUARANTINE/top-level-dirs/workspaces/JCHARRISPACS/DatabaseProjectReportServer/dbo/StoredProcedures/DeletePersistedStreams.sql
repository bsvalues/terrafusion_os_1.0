CREATE PROCEDURE [dbo].[DeletePersistedStreams]
@SessionID varchar(32)
AS
SET NOCOUNT OFF
delete top (10) p
from [ReportServerTempDB].dbo.PersistedStream p
where p.SessionID = @SessionID;

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeletePersistedStreams] TO [RSExecRole]
    AS [dbo];


GO

