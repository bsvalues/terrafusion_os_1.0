
-- exec WATaxStatementLevyCreate_InsertFrom_CurrentRun 2011,1,1,100

create procedure WATaxStatementLevyCreate_InsertFrom_CurrentRun
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@statement_count int,
	@owner_statement_count int,
	@generate_event bit ,
	@run_type char(1),
	@dtNow datetime


as
/*  PROCESSING NOTES:
    This is called by the stored proc:  WATaxStatementLevyCreate
    
    Cannot be a stand-alone proc since it requires some temp tables
    to already exist and be populated
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
 + ' @run_id =' +  convert(varchar(30),@run_id)  + ','
 + ' @statement_count =' +  isnull(convert(varchar(30),@statement_count),'')  + ','
 + ' @owner_statement_count =' +  isnull(convert(varchar(30),@owner_statement_count),'') + ','
 + ' @generate_event =' + isnull(convert(varchar(30),@generate_event),'')  + ','
 + ' @run_type  =' +  isnull(@run_type,'') + ','
 + ' @dtNow datetime =' +  convert(varchar(30),@statement_count) 

 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

-- wa_tax_statement_system_address  
 -- no current_run table was needed at time of this version
 -- since there were no fk's and no other references to this table
insert wa_tax_statement_system_address (
	group_id, year, run_id, property_tax_questions_phone, internet_address, property_value_questions_phone,
	county_logo, treasurer_name, addr_line1, addr_line2, addr_line3, addr_city, addr_state, addr_zip,
	office_hours_line1, office_hours_line2, office_hours_line3, county_name, office_name
	,remittance_addr_line1, remittance_addr_line2, remittance_addr_line3, remittance_addr_city, 
	remittance_addr_state, remittance_addr_zip
)
select
	@group_id, @year, @run_id, property_tax_questions_phone, url, property_value_questions_phone,
	county_logo, chief_appraiser, addr_line1, addr_line2, addr_line3, city, state, zip,
	office_hours_line1, office_hours_line2, office_hours_line3, county_name, office_name,
	remittance_addr_line1, remittance_addr_line2, remittance_addr_line3, remittance_addr_city, 
	remittance_addr_state, remittance_addr_zip
from system_address 
where system_type = 'C'

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 2 Start '

exec WATaxStatementLevyCreate_Insert_wa_tax_statement 
                                   @pacs_user_id,@year,@group_id,@run_id 
SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_assessment_fee
                                   @pacs_user_id,@year,@group_id,@run_id
                                    
SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 4 Start '

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_assessment_fee_display
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 5 Start '

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_delinquent_history
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 6 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 7 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_details_display
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 8 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_display
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 9 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_owner
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 10 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_owner_distribution
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 11 Start '


exec WATaxStatementLevyCreate_Insert_wa_tax_statement_tax_history_comparison
                                   @pacs_user_id,@year,@group_id,@run_id 

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus =  'Step 12 Start '

update wa_tax_statement_run -- pk group_id, year, run_id
   set statement_count = @statement_count
 where group_id = @group_id
   and year = @year 
   and run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
if @generate_event = 1 
   begin
     SET @LogStatus =  'Step 13 Start '
     exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0

     exec WATaxStatementLevyCreate_InsertEvents @pacs_user_id,
												@year,
												@group_id,
												@run_id,
												@statement_count,
												@owner_statement_count,
												@run_type,
												@dtNow
	SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
													
   end

set @StartStep = getdate()
SET @LogStatus =  'Step 14 Start '

/* Processing Notes:

-- wa_tax_statement_history and wa_tax_statement_history_bill_fee_assoc
-- do not have run info fields, so deletion in case of error would be difficult.
-- inserting at the end should make it rare that these tables would ever be written to 
-- if there were errors within the process 

-- wa_tax_statement_history insert must come before insert to 
--   wa_tax_statement_history_bill_fee_assoc due to FK constraints
*/

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_history
     @pacs_user_id,
	 @year,
	 @group_id,
	 @run_id  

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 15 Start '

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_history_bill_fee_assoc
     @pacs_user_id,
	 @year,
	 @group_id,
	 @run_id  

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
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

