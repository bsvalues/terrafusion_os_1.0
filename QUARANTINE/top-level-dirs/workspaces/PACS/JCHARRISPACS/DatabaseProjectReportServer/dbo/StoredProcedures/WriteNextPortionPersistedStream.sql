CREATE PROCEDURE [dbo].[WriteNextPortionPersistedStream]
@DataPointer binary(16),
@DataIndex int,
@DeleteLength int,
@Content image
AS

UPDATETEXT [ReportServerTempDB].dbo.PersistedStream.Content @DataPointer @DataIndex @DeleteLength @Content

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[WriteNextPortionPersistedStream] TO [RSExecRole]
    AS [dbo];


GO

