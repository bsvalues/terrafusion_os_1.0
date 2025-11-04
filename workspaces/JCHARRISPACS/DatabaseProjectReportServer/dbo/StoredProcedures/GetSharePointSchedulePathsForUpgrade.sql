CREATE PROC [dbo].[GetSharePointSchedulePathsForUpgrade]
AS
BEGIN
SELECT DISTINCT [Path], LEN([Path])
  FROM [Schedule]
  WHERE [Path] IS NOT NULL AND [Path] NOT LIKE '/{%'
  ORDER BY LEN([Path]) DESC
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetSharePointSchedulePathsForUpgrade] TO [RSExecRole]
    AS [dbo];


GO

