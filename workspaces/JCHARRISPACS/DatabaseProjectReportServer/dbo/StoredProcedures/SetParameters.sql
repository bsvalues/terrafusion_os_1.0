CREATE PROCEDURE [dbo].[SetParameters]
@Path nvarchar (425),
@Parameter ntext
AS
UPDATE Catalog
SET [Parameter] = @Parameter
WHERE Path = @Path
EXEC FlushReportFromCache @Path

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetParameters] TO [RSExecRole]
    AS [dbo];


GO

