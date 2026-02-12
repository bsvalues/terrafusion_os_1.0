
-- exec dbo.PaymentImportPrepareGather 1012,'2009-04-23'
CREATE PROCEDURE dbo.PaymentImportPrepareGather     
   @runID int,
   @postingDate datetime
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
 + ' @runID =' +  isnull(convert(varchar(30),@runID),'') + ','
 + ' @postingDate =' +  isnull(convert(varchar(30),@postingDate,120),'') 
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */
 
   -- parameters

SET @StepMsg =  'Step 1 Start'
set @StartStep = getdate()  --logging capture start time of step
 
declare @payment_run_id int
set @payment_run_id = @runID

declare @prepare_date datetime
set @prepare_date = @postingDate

declare @single_payment_date bit
set @single_payment_date = 0

select @single_payment_date = case when payment_run_type = 'M' then 1 else 0 end
from import_payment_run with(nolock)
where payment_run_id = @payment_run_id


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 1 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 2 Start'
set @StartStep = getdate()  --logging capture start time of step
 

insert prepare_run_payments
(payment_run_id, payment_run_detail_id, prop_id, statement_id, year, payment_date, is_mismatch)
select @runID, ip.payment_run_detail_id, ip.prop_id, 
	isnull(ip.primary_statement_id,0), ip.year - 1,
	isnull(ip.settlement_date, @prepare_date), 1
from import_payment ip with(nolock)
where ip.payment_run_id = @payment_run_id

-- flag payments where the property, statement, and year don't match any bills or fees
update prp
set is_mismatch = 0
from prepare_run_payments prp with(nolock)
where exists (
	select 1 from bill b with(nolock)
	where b.prop_id = prp.prop_id
	and b.statement_id = prp.statement_id
	and b.year = prp.year
)

update prp
set is_mismatch = 0
from prepare_run_payments prp with(nolock)
where exists (
	select 1 from fee f with(nolock)
	join fee_property_vw fpv with(nolock)
	on fpv.fee_id = f.fee_id
	where fpv.prop_id = prp.prop_id
	and f.statement_id = prp.statement_id
	and f.year = prp.year
)


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 2 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run


if (@single_payment_date = 1)
  begin
   SET @StepMsg =  'Step 3 Start'
   set @StartStep = getdate()  --logging capture start time of step

   exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = 0,
                                  @err_status = 0,
                                  @duration_in_seconds = 0  
                                  
    update prepare_run_payments set payment_date = @prepare_date
      where payment_run_id = @payment_run_id

    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 3 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds   -- list payments in the run    
   end
   
-- find the payment groups for each statement

SET @StepMsg =  'Step 4 Start'
set @StartStep = getdate()  --logging capture start time of step

insert prepare_run_payment_group
(payment_run_id, payment_run_detail_id, payment_group_id, payment_date)

select @runID, prp.payment_run_detail_id, q.payment_group_id, prp.payment_date
from prepare_run_payments prp with(nolock)
inner join 
(
	select distinct isnull(statement_id,0) as statement_id, year, payment_group_id
	from bill b with(nolock)
	where b.payment_group_id is not null
) q
on q.statement_id = prp.statement_id
and q.year = prp.year
where prp.payment_run_id = @payment_run_id
and prp.is_mismatch = 0


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 4 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 5 Start'
set @StartStep = getdate()  --logging capture start time of step
                                  
insert prepare_run_payment_group
(payment_run_id, payment_run_detail_id, payment_group_id, payment_date)

select @runID, prp.payment_run_detail_id, q.payment_group_id, prp.payment_date
from prepare_run_payments prp with(nolock)
inner join
(
	select distinct isnull(statement_id,0) as statement_id, year, payment_group_id
	from fee f with(nolock)
	where f.payment_group_id is not null
) q
on q.statement_id = prp.statement_id
and q.year = prp.year
and not exists (
	select 1 from prepare_run_payment_group prpg
	where prpg.payment_run_id = @payment_run_id
	and prpg.payment_run_detail_id = prp.payment_run_detail_id
	and prpg.payment_group_id = q.payment_group_id
)
where prp.payment_run_id = @payment_run_id
and prp.is_mismatch = 0


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 5 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 6 Start'
set @StartStep = getdate()  --logging capture start time of step
                        
-- list the payable items


-- bills with a listed statement/year
insert prepare_run_items
(payment_run_id, trans_group_id, is_bill, payment_date)
select distinct @runID, bill_id, 1, prp.payment_date
from bill b with(nolock)
join prepare_run_payments prp with(nolock)
on b.statement_id = prp.statement_id
and b.year = prp.year
where prp.payment_run_id = @payment_run_id
and prp.is_mismatch = 0


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 6 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 7 Start'
set @StartStep = getdate()  --logging capture start time of step
       
-- bills in an included payment group
insert prepare_run_items
(payment_run_id, trans_group_id, is_bill, payment_date)

select distinct @runID, bill_id, 1, prpg.payment_date
from bill b with(nolock)
join prepare_run_payment_group prpg with(nolock)
on b.payment_group_id = prpg.payment_group_id
where not exists (
	select 1 from prepare_run_items 
	where payment_run_id = @payment_run_id 
	and trans_group_id = b.bill_id
)
and prpg.payment_run_id = @payment_run_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 7 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 8 Start'
set @StartStep = getdate()  --logging capture start time of step
  
-- fee with a listed statement/year
insert prepare_run_items
(payment_run_id, trans_group_id, is_bill, payment_date)

select distinct @runID, fee_id, 0, prp.payment_date
from fee f with(nolock)
join prepare_run_payments prp with(nolock)
on f.statement_id = prp.statement_id
and f.year = prp.year
where not exists (
	select 1 from prepare_run_items 
	where payment_run_id = @payment_run_id 
	and trans_group_id = f.fee_id
)
and prp.payment_run_id = @payment_run_id
and prp.is_mismatch = 0

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 8 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 9 Start'
set @StartStep = getdate()  --logging capture start time of step
  
-- fees in an included payment group
insert prepare_run_items
(payment_run_id, trans_group_id, is_bill, payment_date)
select distinct @runID, fee_id, 0, prpg.payment_date
from fee f with(nolock)
join prepare_run_payment_group prpg with(nolock)
on f.payment_group_id = prpg.payment_group_id
where not exists 
(select 1 from prepare_run_items where payment_run_id = @payment_run_id and trans_group_id = f.fee_id)
and prpg.payment_run_id = @payment_run_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 9 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 10 Start'
set @StartStep = getdate()  --logging capture start time of step
  
-- List the tax due calculations that need to be run.
-- Copy the list of items to a global temp table so the Tax Due Engine can use it

insert prepare_run_tax_due_assoc
(payment_run_id, payment_date, is_bill)
select distinct @runID, payment_date, is_bill
from prepare_run_items with(nolock)
where payment_run_id = @payment_run_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 10 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 11 Start'
set @StartStep = getdate()  --logging capture start time of step
 

delete ##prepare_run_calc_items
where payment_run_id = @payment_run_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 11 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run

SET @StepMsg =  'Step 12 Start'
set @StartStep = getdate()  --logging capture start time of step
 
insert ##prepare_run_calc_items
(payment_run_id, trans_group_id, is_bill, payment_date)
select @payment_run_id, trans_group_id, is_bill, payment_date
from prepare_run_items
where payment_run_id = @payment_run_id


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 12 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   -- list payments in the run


 
-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds

GO

