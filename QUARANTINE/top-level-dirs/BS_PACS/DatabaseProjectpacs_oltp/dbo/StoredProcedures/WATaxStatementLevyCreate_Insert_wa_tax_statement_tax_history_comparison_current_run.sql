
create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_tax_history_comparison_current_run
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

declare @prev_year numeric(4,0)
    set @prev_year = @year - 1


set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

insert wa_tax_statement_tax_history_comparison_current_run
  (
	group_id, year, run_id, statement_id, tax_district_id, voted,
	curr_year_levy_rate, curr_year_taxes,
	prior_year_levy_rate, prior_year_taxes,
	pct_change_levy_rate, pct_change_taxes, levy_part
)
select distinct
	@group_id, @year, @run_id, wtsl.statement_id, wtsl.tax_district_id, wtsl.voted,
	wtsl.levy_rate, wtsl.tax_amount,
	0, 0,
	100, 0, -- 100 Bug 20969 % Change Difference shows 100% on 0% - RLN,
	levy_part
from wa_tax_statement_levy_current_run as wtsl with(nolock)
where wtsl.group_id = @group_id and wtsl.year = @year and wtsl.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 2 Start '

update thc
set
	prior_year_levy_rate = prev.levy_rate,
	prior_year_taxes = prev.tax_amount
from wa_tax_statement_tax_history_comparison_current_run as thc 
join wa_tax_statement_current_run as wts with(nolock) on
	wts.group_id = thc.group_id and
	wts.year = thc.year and
	wts.run_id = thc.run_id and
	wts.statement_id = thc.statement_id
join (
	select
		b.prop_id,
		lb.tax_district_id,
		voted = case
			when (levycurr.year is not null) and (levycurr.include_in_levy_certification = 1) -- When the levy exists in the current year
			then isnull(levycurr.voted, 0) -- Use the current year voted flag
			else -- The levy does not exist in the current year
				isnull(levy.voted, 0) -- Use the previous year voted flag
		end,
		levy_rate = sum(case 
			when is_tif_sponsoring_levy = 1 then 0
			when (has_senior_ex = 1) and (isnull(levy.senior_levy_rate, 0) > 0)
				then isnull(levy.senior_levy_rate, 0) 
			else isnull(levy.levy_rate, 0) end),
		tax_amount = sum(isnull(b.current_amount_due, 0)),
		lt.levy_part
	from bill as b with(nolock)  -- can't use Temp #bill info becuase it needs prior year info
	join levy_bill as lb with(nolock) -- prior year info retrieved
	on
		lb.bill_id = b.bill_id
	join levy with(nolock) on
		levy.year = b.year and
		levy.tax_district_id = lb.tax_district_id and
		levy.levy_cd = lb.levy_cd
	join levy_type lt with(nolock) on
		lt.levy_type_cd = levy.levy_type_cd
	left outer join 
	levy as levycurr with(nolock) on
	 -- Must left outer join, not inner join
	-- Because:  The levy may not exist in current year, 
	--but the tax district its for may exist in both, and we have to sum
		levycurr.year = @year and
		levycurr.tax_district_id = lb.tax_district_id and
		levycurr.levy_cd = lb.levy_cd
	cross apply (
		select case when exists(
			select 1 from prop_accepted_supp_assoc_vw psa with(nolock)
			join owner o with(nolock)
				on o.prop_id = psa.prop_id
				and o.sup_num = psa.sup_num
				and o.owner_tax_yr = psa.owner_tax_yr
			join property_exemption as pe_snr with(nolock)
				on pe_snr.exmpt_tax_yr = psa.owner_tax_yr
				and pe_snr.owner_tax_yr	= psa.owner_tax_yr
				and pe_snr.prop_id = psa.prop_id
				and pe_snr.sup_num = psa.sup_num
				and pe_snr.owner_id = o.owner_id
				and pe_snr.exmpt_type_cd = 'SNR/DSBL'
			where psa.prop_id = b.prop_id
				and psa.owner_tax_yr = b.year
		) then 1 else 0 end has_senior_ex
	) senior_check
	cross apply (
		select case when exists(
			select 1
			from tif_area_levy tal with(nolock)
			where tal.year = levy.year
			and tal.linked_tax_district_id = levy.tax_district_id
			and tal.linked_levy_cd = levy.levy_cd
		) then 1 else 0 end is_tif_sponsoring_levy
	) spon
	where b.year = @prev_year 
	group by
		b.prop_id,
		lb.tax_district_id,
		case
			when (levycurr.year is not null) and (levycurr.include_in_levy_certification = 1) -- When the levy exists in the current year
			then isnull(levycurr.voted, 0) -- Use the current year voted flag
			else -- The levy does not exist in the current year
				isnull(levy.voted, 0) -- Use the previous year voted flag
		end,
		lt.levy_part
) as prev on
	prev.prop_id = wts.prop_id and
	prev.tax_district_id = thc.tax_district_id and
	prev.voted = thc.voted and
	prev.levy_part = thc.levy_part
where thc.group_id = @group_id and thc.year = @year and thc.run_id = @run_id
  and wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '

update thc
set
	thc.pct_change_levy_rate = 
		((curr_year_levy_rate - prior_year_levy_rate) / prior_year_levy_rate) * 100.0
from wa_tax_statement_tax_history_comparison_current_run as thc 
where thc.group_id = @group_id and thc.year = @year and thc.run_id = @run_id
and thc.prior_year_levy_rate > 0 and thc.curr_year_levy_rate > 0

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 4 Start '

update thc
set
	thc.pct_change_taxes =
		((curr_year_taxes - prior_year_taxes) / prior_year_taxes) * 100.0
from wa_tax_statement_tax_history_comparison_current_run as thc 
where thc.group_id = @group_id and thc.year = @year and thc.run_id = @run_id
and thc.prior_year_taxes > 0 and thc.curr_year_taxes > 0

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 5 Start '

-- Update wa_tax_statement summary columns based on the comparison history columns
	
update wts
set
	wts.comparison_voted_sum_prev_levy_rate = voted.total_prior_year_levy_rate,
	wts.comparison_voted_sum_prev_taxes = voted.total_prior_year_taxes,
	wts.comparison_voted_sum_curr_levy_rate = voted.total_curr_year_levy_rate,
	wts.comparison_voted_sum_curr_taxes = voted.total_curr_year_taxes
from wa_tax_statement_current_run as wts 
join (
	select
		thc.statement_id,
		total_curr_year_levy_rate = sum(curr_year_levy_rate),
		total_curr_year_taxes = sum(curr_year_taxes),
		total_prior_year_levy_rate = sum(prior_year_levy_rate),
		total_prior_year_taxes = sum(prior_year_taxes)
	from wa_tax_statement_tax_history_comparison_current_run as thc with(nolock)
	where thc.group_id = @group_id and thc.year = @year and thc.run_id = @run_id
	and thc.voted = 1
	group by thc.statement_id
) as voted on
	voted.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 6 Start '

update wts
set
	wts.comparison_nonvoted_sum_prev_levy_rate = nonvoted.total_prior_year_levy_rate,
	wts.comparison_nonvoted_sum_prev_taxes = nonvoted.total_prior_year_taxes,
	wts.comparison_nonvoted_sum_curr_levy_rate = nonvoted.total_curr_year_levy_rate,
	wts.comparison_nonvoted_sum_curr_taxes = nonvoted.total_curr_year_taxes
from wa_tax_statement_current_run as wts 
join (
	select
		thc.statement_id,
		total_curr_year_levy_rate = sum(curr_year_levy_rate),
		total_curr_year_taxes = sum(curr_year_taxes),
		total_prior_year_levy_rate = sum(prior_year_levy_rate),
		total_prior_year_taxes = sum(prior_year_taxes)
	from wa_tax_statement_tax_history_comparison_current_run as thc with(nolock)
	where thc.group_id = @group_id and thc.year = @year and thc.run_id = @run_id
	and thc.voted = 0
	group by thc.statement_id
) as nonvoted on
	nonvoted.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 7 Start '

update wts
set
	wts.comparison_voted_overall_pct_change_levy_rate =
		((wts.comparison_voted_sum_curr_levy_rate - wts.comparison_voted_sum_prev_levy_rate)
		     / wts.comparison_voted_sum_prev_levy_rate) * 100.0
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and wts.comparison_voted_sum_prev_levy_rate > 0 
and wts.comparison_voted_sum_curr_levy_rate > 0

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 8 Start '

update wts
set
	wts.comparison_nonvoted_overall_pct_change_levy_rate =
		((wts.comparison_nonvoted_sum_curr_levy_rate - wts.comparison_nonvoted_sum_prev_levy_rate) / wts.comparison_nonvoted_sum_prev_levy_rate) * 100.0
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
  and wts.comparison_nonvoted_sum_prev_levy_rate > 0
  and wts.comparison_nonvoted_sum_curr_levy_rate > 0

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 9 Start '

update wts
set
	wts.comparison_voted_overall_pct_change_taxes =
		((wts.comparison_voted_sum_curr_taxes - wts.comparison_voted_sum_prev_taxes) / wts.comparison_voted_sum_prev_taxes) * 100.0
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and wts.comparison_voted_sum_prev_taxes > 0 
and wts.comparison_voted_sum_curr_taxes > 0

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 10 Start '

update wts
set
	wts.comparison_nonvoted_overall_pct_change_taxes =
		((wts.comparison_nonvoted_sum_curr_taxes - wts.comparison_nonvoted_sum_prev_taxes)
		   / wts.comparison_nonvoted_sum_prev_taxes) * 100.0
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and wts.comparison_nonvoted_sum_prev_taxes > 0 
and wts.comparison_nonvoted_sum_curr_taxes > 0

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	-------------------------------
	------------------------------------------
	-- BEGIN - wa_tax_statement_tax_history_comparison.order_num
	------------------------------------------


set @StartStep = getdate()
SET @LogStatus =  'Step 11 Start '

-- determine order number based on statement_id,voted and tax_district_id seq
create table #comparison_order
( statement_id int
 ,tax_district_id int
 ,voted bit
 ,levy_part int
 ,order_num int
)

insert into #comparison_order(statement_id,tax_district_id,voted,levy_part,order_num)
select  statement_id,tax_district_id,voted,levy_part
        ,ROW_NUMBER() OVER (PARTITION BY statement_id,voted
          ORDER BY statement_id,voted, tax_district_id ) as order_num
       from wa_tax_statement_tax_history_comparison_current_run wts with (nolock)
      where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
      order by statement_id,voted,tax_district_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 12 Start '
      
update wts
   set order_num = tmp.order_num
 
 from wa_tax_statement_tax_history_comparison_current_run as wts
      join
      #comparison_order as tmp
  on wts.statement_id = tmp.statement_id
 and wts.tax_district_id = tmp.tax_district_id
 and wts.voted = tmp.voted
 and wts.levy_part = tmp.levy_part
 where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #comparison_order

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

