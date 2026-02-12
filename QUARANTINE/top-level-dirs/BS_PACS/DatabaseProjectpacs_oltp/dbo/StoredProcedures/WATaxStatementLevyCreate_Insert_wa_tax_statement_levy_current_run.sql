
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_current_run 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_current_run
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int 
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
 + ' @run_id =' +  convert(varchar(30),@run_id) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '


insert wa_tax_statement_levy_current_run 
(
	  group_id
	, year
	, run_id
	, statement_id
	, tax_district_id
	, voted
	, levy_rate
	, tax_amount
	, gross_tax_amount
	, prior_yr_tax_amount
	, levy_part
)
select
	@group_id
	, @year
	, @run_id
	, wts.statement_id
	, wts.tax_district_id
	, isnull(wts.voted, 0)   -- voted
	, sum(isNull(wts.levy_rate, 0))  -- levy_rate
	, sum(wts.tax_amount)  -- tax_amount
	, sum(isNull(wts.gross_tax_amount, 0))  -- gross_tax_amount
	, max(wts.prior_yr_tax_amount)  -- prior_yr_tax_amount
	, levy_part
from wa_tax_statement_levy_details_display_current_run wts
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
group by wts.statement_id, wts.tax_district_id, isnull(wts.voted, 0), levy_part


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 2 Start '

-- determine order number based on statement_id,voted and tax_district_id seq
create table #levy_order
( statement_id int
 ,tax_district_id int
 ,voted bit
 ,levy_part int
 ,order_num int
)

insert into #levy_order(statement_id,tax_district_id,voted,levy_part,order_num)
select  statement_id,tax_district_id,voted,levy_part
        ,ROW_NUMBER() OVER (PARTITION BY statement_id,voted
          ORDER BY statement_id,voted, levy_part desc, tax_district_id ) as order_num
       from wa_tax_statement_levy_current_run wts 
      where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
      order by statement_id,voted,levy_part desc, tax_district_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '
      
update wts
   set order_num = tmp.order_num
 
 from wa_tax_statement_levy_current_run as wts
      join
      #levy_order as tmp
  on wts.statement_id = tmp.statement_id
 and wts.tax_district_id = tmp.tax_district_id
 and wts.voted = tmp.voted
 and wts.levy_part = tmp.levy_part
 where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #levy_order

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

