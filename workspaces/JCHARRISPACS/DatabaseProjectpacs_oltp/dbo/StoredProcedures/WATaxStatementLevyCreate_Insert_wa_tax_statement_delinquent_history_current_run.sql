
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_delinquent_history_current_run 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_delinquent_history_current_run
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@dataset_id_delq_bill int,
	@dataset_id_delq_fee int 
 
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
 + ' @run_id =' +  convert(varchar(30),@run_id) + ',' 
 + ' @dataset_id_delq_bill =' +  convert(varchar(30),@dataset_id_delq_bill) + ','
 + ' @dataset_id_delq_fee =' +  convert(varchar(30),@dataset_id_delq_fee)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

-- First, add the rows for the current year
insert wa_tax_statement_delinquent_history_current_run  (
	group_id, year, run_id, statement_id, delinquent_year,
	base_amount, interest_amount, penalty_amount,
	total
)
select
	@group_id, @year, @run_id, wts.statement_id, @year,
	wts.full_tax_amount, wts.full_interest_amount, wts.full_penalty_amount,
	wts.full_tax_amount + wts.full_interest_amount + wts.full_penalty_amount
from wa_tax_statement_current_run as wts with(nolock)
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 2 Start '	

declare @num_history_years numeric(4,0)
set @num_history_years = 3
declare @min_year numeric(4,0)
set @min_year = @year - @num_history_years
declare @index int
set @index = 1
declare @tblYears table (
	year numeric(4,0) not null
)
while (@index <= @num_history_years)
begin
	insert @tblYears (year)
	values (@year - @index)
	
	set @index = @index + 1
end

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 3 Start '	


-- Next, add the rows for the delinquent years, starting with zero values
insert wa_tax_statement_delinquent_history_current_run 
 (
	  group_id
	, year
	, run_id
	, statement_id
	, delinquent_year
	, base_amount
	, interest_amount
	, penalty_amount
	, total
)
select
	  @group_id  -- group_id
	, @year      -- year
	, @run_id    -- run_id
	, wts.statement_id
	, t.year     -- delinquent_year
	, 0          -- base_amount
	, 0          -- interest_amount
	, 0          -- penalty_amount
	, 0          -- total
from wa_tax_statement_current_run as wts with(nolock)
join @tblYears as t on
	0 = 0
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()

-- get info for updating deqinquent years
create table #tmpDelq
(
	statement_id int,
	year numeric(4,0),
	amt_base numeric(14,2),
	amt_interest numeric(14,2), 
	amt_penalty numeric(14,2)
) 

if (@dataset_id_delq_bill > 0)
begin
    SET @LogStatus = 'Step 4 Start '	
    exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0
    
	insert into #tmpDelq
	(
		statement_id,
		year,
		amt_base,
		amt_interest, 
		amt_penalty 
	)
	select
		tsi.cy_statement_id,
		case
			when b.year < @min_year
			then @min_year
			else b.year
		end,
		bpd.amount_due - bpd.amount_paid,
		bpd.amt_interest + bpd.amt_bond_interest,
		bpd.amt_penalty
	
	from tax_due_calc_bill as b with(nolock) -- pk clust dataset_id, bill_id; idx dataset_id, year, statement_id	
	
	join tax_due_calc_bill_payments_due as bpd with(nolock) -- pk clust dataset_id, bill_id, payment_id
	on b.dataset_id = bpd.dataset_id
	and b.bill_id = bpd.bill_id
	
	join #tblStatementInfo tsi
	on b.statement_id = tsi.statement_id
	and b.year = tsi.year
	and b.prop_id = tsi.prop_id

	join bill with(nolock)
	on bill.payment_group_id = tsi.payment_group_id and bill.year = tsi.year and bill.prop_id = b.prop_id and bill.sup_num = b.sup_num and bill.bill_id = b.bill_id
	
	where b.dataset_id = @dataset_id_delq_bill


		SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	end
	
set @StartStep = getdate()

if (@dataset_id_delq_fee > 0)
  begin
    SET @LogStatus = 'Step 5 Start '	
    exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0

	insert into #tmpDelq
	(
		statement_id,
		year,
		amt_base,
		amt_interest, 
		amt_penalty 
	)	
	select
		tsi.cy_statement_id,
		case
			when f.year < @min_year
			then @min_year
			else f.year
		end,
		amt_base = fpd.amount_due - fpd.amount_paid,
		amt_interest = fpd.amt_interest + fpd.amt_bond_interest,
		fpd.amt_penalty
		
	from tax_due_calc_fee f with(nolock) -- pk clust dataset_id, fee_id	
	
	join tax_due_calc_fee_payments_due fpd with(nolock) -- pk clust dataset_id, fee_id, payment_id
	on f.dataset_id = fpd.dataset_id
	and f.fee_id = fpd.fee_id
	
	join fee_property_vw fpv with(nolock)
	on fpv.fee_id = f.fee_id
	
	join #tblStatementInfo tsi
	on f.statement_id = tsi.statement_id
	and f.year = tsi.year
	and fpv.prop_id = tsi.prop_id

	join fee with(nolock)
	on fee.payment_group_id = tsi.payment_group_id and fee.year = tsi.year and fee.fee_id = f.fee_id
				
	where f.dataset_id = @dataset_id_delq_fee

	SELECT @LogTotRows = @@ROWCOUNT,
	       @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

				
	end

set @StartStep = getdate()
SET @LogStatus = 'Step 6 Start '	

create table #matchDelq
(
	statement_id int,
	year numeric(4,0),
	amt_base numeric(28,2),
	amt_interest numeric(28,2), 
	amt_penalty numeric(28,2)
) 

insert into #matchDelq
(
	statement_id,
	year,
	amt_base,
	amt_interest, 
	amt_penalty 
) 
select
	statement_id,
	year,
	amt_base = sum(amt_base),
	amt_interest = sum(amt_interest),
	amt_penalty = sum(amt_penalty)

from #tmpDelq
group by statement_id, year


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 7 Start '	


create index idx_delq on #matchDelq(statement_id,year,amt_base,amt_interest,amt_penalty)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 8 Start '	


-- Now update the delinquent years
update delq
set
	delq.base_amount = dues.amt_base,
	delq.interest_amount = dues.amt_interest,
	delq.penalty_amount = dues.amt_penalty,
	delq.total = dues.amt_base + dues.amt_interest + dues.amt_penalty
from wa_tax_statement_delinquent_history_current_run as delq
 
join #matchDelq dues
on dues.statement_id = delq.statement_id
and dues.year = delq.delinquent_year

where delq.group_id = @group_id
and delq.year = @year
and delq.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #matchDelq
drop table #tmpDelq


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

