
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_owner_distribution 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_owner_distribution
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int 
as

/*  PROCESSING NOTES:
    This is called by the stored proc:  WATaxStatementLevyCreate_InsertFrom_CurrentRun
    which is called by the stored proc:  WATaxStatementLevyCreate
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
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
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


INSERT INTO dbo.wa_tax_statement_owner_distribution
(
   [group_id]
  ,[year]
  ,[run_id]
  ,[owner_id]
  ,[td_code01]
  ,[td_desc01]
  ,[td_full_total_01]
  ,[td_code02]
  ,[td_desc02]
  ,[td_full_total_02]
  ,[td_code03]
  ,[td_desc03]
  ,[td_full_total_03]
  ,[td_code04]
  ,[td_desc04]
  ,[td_full_total_04]
  ,[td_code05]
  ,[td_desc05]
  ,[td_full_total_05]
  ,[td_code06]
  ,[td_desc06]
  ,[td_full_total_06]
  ,[td_code07]
  ,[td_desc07]
  ,[td_full_total_07]
  ,[td_code08]
  ,[td_desc08]
  ,[td_full_total_08]
  ,[td_code09]
  ,[td_desc09]
  ,[td_full_total_09]
  ,[td_code10]
  ,[td_desc10]
  ,[td_full_total_10]
  ,[td_code11]
  ,[td_desc11]
  ,[td_full_total_11]
  ,[af_code01]
  ,[af_desc01]
  ,[af_full_total_01]
  ,[af_code02]
  ,[af_desc02]
  ,[af_full_total_02]
  ,[af_code03]
  ,[af_desc03]
  ,[af_full_total_03]
  ,[af_code04]
  ,[af_desc04]
  ,[af_full_total_04]
  ,[af_code05]
  ,[af_desc05]
  ,[af_full_total_05]
  ,[af_code06]
  ,[af_desc06]
  ,[af_full_total_06]
  ,[af_code07]
  ,[af_desc07]
  ,[af_full_total_07]
)

SELECT [group_id]
      ,[year]
      ,[run_id]
      ,[owner_id]
      ,[td_code01]
      ,[td_desc01]
      ,[td_full_total_01]
      ,[td_code02]
      ,[td_desc02]
      ,[td_full_total_02]
      ,[td_code03]
      ,[td_desc03]
      ,[td_full_total_03]
      ,[td_code04]
      ,[td_desc04]
      ,[td_full_total_04]
      ,[td_code05]
      ,[td_desc05]
      ,[td_full_total_05]
      ,[td_code06]
      ,[td_desc06]
      ,[td_full_total_06]
      ,[td_code07]
      ,[td_desc07]
      ,[td_full_total_07]
      ,[td_code08]
      ,[td_desc08]
      ,[td_full_total_08]
      ,[td_code09]
      ,[td_desc09]
      ,[td_full_total_09]
      ,[td_code10]
      ,[td_desc10]
      ,[td_full_total_10]
      ,[td_code11]
      ,[td_desc11]
      ,[td_full_total_11]
      ,[af_code01]
      ,[af_desc01]
      ,[af_full_total_01]
      ,[af_code02]
      ,[af_desc02]
      ,[af_full_total_02]
      ,[af_code03]
      ,[af_desc03]
      ,[af_full_total_03]
      ,[af_code04]
      ,[af_desc04]
      ,[af_full_total_04]
      ,[af_code05]
      ,[af_desc05]
      ,[af_full_total_05]
      ,[af_code06]
      ,[af_desc06]
      ,[af_full_total_06]
      ,[af_code07]
      ,[af_desc07]
      ,[af_full_total_07]
  FROM dbo.wa_tax_statement_owner_distribution_current_run
where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


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

