
CREATE PROCEDURE TableCacheStatusUpdateAll

AS

SET NOCOUNT ON

update table_cache_status set lDummy = 0

GO

