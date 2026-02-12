
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_history_bill_fee_assoc 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_history_bill_fee_assoc
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int 
as

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON


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
SET @LogStatus = 'Step 1 Start '

BEGIN TRY

-- insert bill type records
insert wa_tax_statement_history_bill_fee_assoc
(
 year
,statement_id
,bill_fee_id
,id_type
)
select  wtscb.year
       ,wtscb.statement_id
       ,wtscb.bill_id  -- bill_fee_id
       ,'B' -- id_type
  from #wa_tax_statement_calc_bill as wtscb 
       left join
     wa_tax_statement_history_bill_fee_assoc as verify
  on wtscb.year = verify.year 
 and wtscb.statement_id = verify.statement_id 
 and wtscb.bill_id = verify.bill_fee_id 
 and verify.id_type = 'B'
 where verify.statement_id is null -- only insert ones that don't exist in real table

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 2 Start '

-- insert fee type records
insert wa_tax_statement_history_bill_fee_assoc
(
 year
,statement_id
,bill_fee_id
,id_type
)
select  wtscf.year
       ,wtscf.statement_id
       ,wtscf.fee_id  -- bill_fee_id
       ,'F' -- id_type
  from #wa_tax_statement_calc_fee as wtscf
       left join
       wa_tax_statement_history_bill_fee_assoc as verify
    on wtscf.year = verify.year 
   and wtscf.statement_id = verify.statement_id 
   and wtscf.fee_id = verify.bill_fee_id 
   and verify.id_type = 'F'
 where verify.statement_id is null -- only insert ones that don't exist in real table
 
SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
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

