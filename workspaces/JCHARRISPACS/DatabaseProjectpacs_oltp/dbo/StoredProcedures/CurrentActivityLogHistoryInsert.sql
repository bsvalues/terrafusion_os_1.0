
CREATE Procedure dbo.CurrentActivityLogHistoryInsert

AS
SET NOCOUNT ON
DECLARE @day datetime
SELECT @day = (SELECT Top 1 execution_time from dbo.current_activity_log)
IF DATEDIFF(d,@day,getdate()) <> 0 
   BEGIN
   -- insert current records into history table,clear this table 
   -- for today's entries
   INSERT INTO dbo.current_activity_log_history
   (
    process_name  ,
    status_msg ,
    execution_time  ,
    row_count ,
    err_status  ,
    login_name ,
    username  ,
    database_name ,
    process_id  , 
    application_name ,
    computer_name ,
    duration_in_seconds
    )
     SELECT process_name  ,
	        status_msg ,
	        execution_time  ,
	        row_count ,
            err_status  ,
            login_name ,
            username  ,
            database_name ,
            process_id  , 
            application_name ,
            computer_name,
            duration_in_seconds
      FROM dbo.current_activity_log
   -- now clear current entry table 
   TRUNCATE TABLE dbo.current_activity_log
  END

-- check for history entries to delete
EXEC dbo.CurrentActivityLogHistoryDelete

GO

