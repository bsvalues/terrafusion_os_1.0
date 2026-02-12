CREATE PROCEDURE [dbo].[SetHistoryLimit]
@Path nvarchar (425),
@SnapshotLimit int = NULL
AS
UPDATE Catalog
SET SnapshotLimit=@SnapshotLimit
WHERE Path = @Path

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetHistoryLimit] TO [RSExecRole]
    AS [dbo];


GO

