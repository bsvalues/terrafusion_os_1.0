
-- exec dbo.PaymentImportPrepareCleanup 1

CREATE PROCEDURE dbo.PaymentImportPrepareCleanup     
   @runID int
 AS
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows bigint
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)
 
    SET @StartEndMsg = 'Start - ' + @proc  
 + ' @runID =' +  isnull(convert(varchar(30),@runID),'')
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */ 

SET @StepMsg =  'Step 1 Start'
set @StartStep = getdate()  --logging capture start time of step
 
delete tax_due_calc_bill
where dataset_id in (select dataset_id from prepare_run_tax_due_assoc where payment_run_id = @runID and is_bill = 1)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 1 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 2 Start'
set @StartStep = getdate()  --logging capture start time of step
                                  
delete tax_due_calc_fee
where dataset_id in (select dataset_id from prepare_run_tax_due_assoc where  payment_run_id = @runID and is_bill = 0)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 2 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 3 Start'
set @StartStep = getdate()  --logging capture start time of step

delete ##prepare_run_calc_items
where payment_run_id = @runID

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 3 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 4 Start'
set @StartStep = getdate()  --logging capture start time of step
					
delete from prepare_run_payments where payment_run_id = @runID

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 4 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 5 Start'
set @StartStep = getdate()  --logging capture start time of step

delete from  prepare_run_payment_group where payment_run_id = @runID

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 5 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 6 Start'
set @StartStep = getdate()  --logging capture start time of step

delete from  prepare_run_items where payment_run_id = @runID

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 6 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 7 Start'
set @StartStep = getdate()  --logging capture start time of step

delete from prepare_run_tax_due_assoc where payment_run_id = @runID

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 7 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds


-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds

GO

