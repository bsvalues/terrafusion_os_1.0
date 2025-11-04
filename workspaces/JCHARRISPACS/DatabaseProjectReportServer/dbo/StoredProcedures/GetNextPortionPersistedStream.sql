CREATE PROCEDURE [dbo].[GetNextPortionPersistedStream]
@DataPointer binary(16),
@DataIndex int,
@Length int
AS

READTEXT [ReportServerTempDB].dbo.PersistedStream.Content @DataPointer @DataIndex @Length

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetNextPortionPersistedStream] TO [RSExecRole]
    AS [dbo];


GO

