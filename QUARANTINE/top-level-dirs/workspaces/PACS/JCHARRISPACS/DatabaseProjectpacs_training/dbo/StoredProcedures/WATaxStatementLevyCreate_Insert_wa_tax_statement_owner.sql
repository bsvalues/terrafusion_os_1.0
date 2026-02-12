
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_owner 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_owner
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


INSERT INTO dbo.wa_tax_statement_owner
(
   [group_id]
  ,[year]
  ,[run_id]
  ,[owner_id]
  ,[owner_name]
  ,[total_taxable_value]
  ,[voter_approved_tax_amount]
  ,[half_due_date]
  ,[half_tax_amount]
  ,[half_penalty_amount]
  ,[half_interest_amount]
  ,[half_total_due]
  ,[full_due_date]
  ,[full_tax_amount]
  ,[full_penalty_amount]
  ,[full_interest_amount]
  ,[full_total_due]
  ,[prior_year_0_tax_amount]
  ,[prior_year_0_interest]
  ,[prior_year_0_penalty]
  ,[prior_year_1_tax_amount]
  ,[prior_year_1_interest]
  ,[prior_year_1_penalty]
  ,[prior_year_delq_tax_amount]
  ,[prior_year_delq_interest]
  ,[prior_year_delq_penalty]
  ,[delinquent_tax_amount]
  ,[delinquent_interest]
  ,[delinquent_penalty]
  ,[delinquent_total_due]
  ,[total_due]
  ,[gross_tax]
  ,[addr_line1]
  ,[addr_line2]
  ,[addr_line3]
  ,[carrier_route]
  ,[addr_city]
  ,[addr_state]
  ,[addr_country]
  ,[addr_zip]
  ,[addr_is_international]
  ,[addr_is_deliverable]
  ,[scanline]
  ,[property_count]
  ,[show_half_pay_line]
  ,[generated_by]
  ,[scanline2]
)

SELECT [group_id]
      ,[year]
      ,[run_id]
      ,[owner_id]
      ,[owner_name]
      ,[total_taxable_value]
      ,[voter_approved_tax_amount]
      ,[half_due_date]
      ,[half_tax_amount]
      ,[half_penalty_amount]
      ,[half_interest_amount]
      ,[half_total_due]
      ,[full_due_date]
      ,[full_tax_amount]
      ,[full_penalty_amount]
      ,[full_interest_amount]
      ,[full_total_due]
      ,[prior_year_0_tax_amount]
      ,[prior_year_0_interest]
      ,[prior_year_0_penalty]
      ,[prior_year_1_tax_amount]
      ,[prior_year_1_interest]
      ,[prior_year_1_penalty]
      ,[prior_year_delq_tax_amount]
      ,[prior_year_delq_interest]
      ,[prior_year_delq_penalty]
      ,[delinquent_tax_amount]
      ,[delinquent_interest]
      ,[delinquent_penalty]
      ,[delinquent_total_due]
      ,[total_due]
      ,[gross_tax]
      ,[addr_line1]
      ,[addr_line2]
      ,[addr_line3]
      ,[carrier_route]
      ,[addr_city]
      ,[addr_state]
      ,[addr_country]
      ,[addr_zip]
      ,[addr_is_international]
      ,[addr_is_deliverable]
      ,[scanline]
      ,[property_count]
      ,[show_half_pay_line]
      ,[generated_by]
      ,[scanline2]
  FROM dbo.wa_tax_statement_owner_current_run
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

