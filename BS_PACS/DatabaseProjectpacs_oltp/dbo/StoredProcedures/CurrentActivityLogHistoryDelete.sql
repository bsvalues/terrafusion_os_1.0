
CREATE Procedure dbo.CurrentActivityLogHistoryDelete

AS
SET NOCOUNT ON
-- delete entries from current_activity_log_history over 1 year old
DECLARE @yeardate datetime
    SET @yeardate = dateadd(yy,-1,getdate())

IF EXISTS(SELECT Top 1 execution_time from dbo.current_activity_log_history 
                  where execution_time < @yeardate)
  BEGIN
   -- delete records older than 1 year 
    DELETE FROM dbo.current_activity_log_history
     where execution_time < @yeardate
  END

GO

