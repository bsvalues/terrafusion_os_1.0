
-- exec WATaxStatementLevyCreate_Delete_CurrentRun 2011,1,1

create procedure WATaxStatementLevyCreate_Delete_CurrentRun
	@year numeric(4,0),
	@group_id int,
	@run_id int 
as

/*  PROCESSING NOTES:
    This is called by the stored proc:  WATaxStatementLevyCreate
    This clears entries from the work tables with a _current_run suffix
    that are mirrors of the tables used to create tax statements
    
    Can be called by itself if a need to clean up run data is needed
*/

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON

BEGIN TRY

DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)

 SET @qry = 'Start - ' + @proc  
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

delete wa_tax_statement_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 2 Start '

delete wa_tax_statement_assessment_fee_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '

delete wa_tax_statement_assessment_fee_display_current_run
  where group_id = @group_id and year = @year and run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 4 Start '

delete wa_tax_statement_delinquent_history_current_run
  where group_id = @group_id and year = @year  and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 5 Start '

delete wa_tax_statement_levy_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 6 Start '

delete wa_tax_statement_levy_details_display_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 7 Start '
  
delete wa_tax_statement_levy_display_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 8 Start '

delete wa_tax_statement_owner_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 9 Start '

delete wa_tax_statement_owner_distribution_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 10 Start '

delete wa_tax_statement_tax_history_comparison_current_run
  where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

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
	@AppMsg = 'Error in proc: ' + @proc + ' ' + @LogStatus + @ERROR_MESSAGE
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER

    RAISERROR(@AppMsg , 16, 1) 

	
END CATCH

GO

