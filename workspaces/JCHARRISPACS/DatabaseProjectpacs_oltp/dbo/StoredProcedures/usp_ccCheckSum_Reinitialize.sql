
CREATE PROCEDURE dbo.usp_ccCheckSum_Reinitialize
  @old_table_name sysname
 ,@new_table_name sysname 
 ,@PKColNames varchar(1000)
 ,@debug bit = 0
 
AS 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)
 
    SET @StartEndMsg = 'Start - ' + @proc  
 + ' @old_table_name =' +  isnull(convert(varchar(30),@old_table_name),'') + ','
 + ' @new_table_name =' +  isnull(convert(varchar(30),@new_table_name),'') + ','
 + ' @PKColNames =' +  isnull(@PKColNames,'') + ','
 + ' @debug =' +  isnull(convert(varchar(30),@debug),'') 
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */
 
DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10)
declare @sql varchar(max)


BEGIN TRY   --- SET UP ERROR HANDLING

set @StepMsg = 'Step 1 '

if exists(select 1 from sys.tables where name = @old_table_name) 
   begin 
        set @sql = 'truncate table ' + @old_table_name + @CRLF
                 + ' drop table ' + @old_table_name + @CRLF
        if @debug = 1
           begin 
             print @sql
           end
        exec (@sql)
   end        
                  
set @StepMsg = 'Step 2 '

-- no old data exists, just insert data to old
set @sql = 'select * into ' + @old_table_name + @CRLF
         + ' from ' + @new_table_name 

if @debug = 1
   begin 
     print @sql
   end
exec (@sql)

set @StepMsg = 'Step 3 '
         
-- create index on PK for quicker compares
set @sql = ' create clustered index idx_PK on ' + @old_table_name +  '(' + @PKColNames + ')'
if @debug = 1
   begin 
     print @sql
   end
exec (@sql)  

set @StepMsg = 'Step 4 '

-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds
                                  
END TRY

BEGIN CATCH
	DECLARE
	@ERROR_SEVERITY INT,
	@ERROR_STATE INT,
	@ERROR_NUMBER INT,
	@ERROR_LINE INT,
	@ERROR_MESSAGE VARCHAR(245),
    @AppMsg varchar(2000)
    
	SELECT
	@ERROR_SEVERITY = ERROR_SEVERITY(),
	@ERROR_STATE = ERROR_STATE(),
	@ERROR_NUMBER = ERROR_NUMBER(),
	@ERROR_LINE = ERROR_LINE(),
	@ERROR_MESSAGE = ERROR_MESSAGE(),
	@AppMsg = 'Error in proc: ' + @proc + ' ' + @StepMsg + @ERROR_MESSAGE
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER

   RAISERROR(@AppMsg , 16, 1) 

	
END CATCH

GO

