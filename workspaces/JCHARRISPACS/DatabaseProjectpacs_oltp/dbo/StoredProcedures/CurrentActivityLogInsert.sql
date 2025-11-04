CREATE Procedure dbo.CurrentActivityLogInsert 
  @process_name varchar (100)  ,
  @status_msg varchar (3000),
  @row_count bigint = NULL ,
  @err_status int = NULL ,
  @duration_in_seconds int = NULL

AS

-- call proc to insert into history and clear current day's entry, if needed
exec dbo.CurrentActivityLogHistoryInsert

-- insert current entry 
INSERT INTO dbo.current_activity_log(process_name,status_msg,row_count,err_status,duration_in_seconds)
values (@process_name ,@status_msg,@row_count,@err_status,@duration_in_seconds)

GO

