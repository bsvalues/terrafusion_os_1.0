
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_details_display_current_run 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_details_display_current_run
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

if object_id('tempdb..#wpovTaxable') is not null drop table #wpovTaxable 
if object_id('tempdb..#cad') is not null drop table #cad 
if object_id('tempdb..#pad') is not null drop table #pad 
if object_id('tempdb..#tmpPriorYearMissingLevy') is not null drop table #tmpPriorYearMissingLevy 

declare @prev_yr numeric(4,0)
    set @prev_yr = @year -1
    
set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

BEGIN TRY
-- get needed info before doing a group by
create table #wpovTaxable
( 
  statement_id int
 ,prop_id int
 ,sup_num int
 ,tax_district_id int
 ,levy_cd varchar (10)
 ,voted bit
 ,levy_rate numeric(13,10)
 ,current_amount_due numeric(14,2)
 ,taxable numeric(28,0)  
 ,tax_wout_ex_amt numeric(14,2)
 ,levy_description varchar(50)
 ,prior_yr_tax_amount numeric(14,2)
 ,levy_part int
)


insert into #wpovTaxable
(
  statement_id 
 ,prop_id
 ,sup_num 
 ,tax_district_id 
 ,levy_cd
 ,voted 
 ,levy_rate 
 ,current_amount_due 
 ,taxable 
 ,tax_wout_ex_amt
 ,levy_description
 ,prior_yr_tax_amount 
 ,levy_part
)

select 
 wts.statement_id
,psa.prop_id 
,psa.sup_num
,levy.tax_district_id
,levy.levy_cd
,isnull(levy.voted, 0) as voted
,case when is_tif_sponsoring_levy = 1 then 0
	when (curr_senior_ex = 1) and (isnull(levy.senior_levy_rate, 0) > 0)
		then isnull(levy.senior_levy_rate, 0) 
	else isnull(levy.levy_rate, 0) 
	end as levy_rate
,wts.current_amount_due
,isNull(wpovTaxable.taxable, 0) as taxable
,isNull(wpovTaxable.tax_wout_ex_amt, 0) as tax_wout_ex_amt -- gross_tax_amount
,LEFT(isNull(levy.levy_description, ''), 32)  as levy_description
,isnull(prev.prior_yr_tax_amount,0)
,isnull(lt.levy_part,0)
from #wa_tax_statement_calc_bill as wts 
     join 
     levy_bill as lb with(nolock)
  on lb.bill_id = wts.bill_id
     join levy with(nolock)
  on levy.year = wts.year
 and levy.tax_district_id = lb.tax_district_id 
 and levy.levy_cd = lb.levy_cd
 and levy.include_in_levy_certification = 1
 and isnull(levy.end_year, levy.year) >= levy.year
inner join levy_type as lt with(nolock)
	on levy.levy_type_cd = lt.levy_type_cd 
join prop_accepted_supp_assoc_vw as psa with(nolock) on
	psa.owner_tax_yr = @year and
	psa.prop_id = wts.prop_id
cross apply (
	select case when exists(
		select 1 
		from owner o with(nolock)
		join property_exemption as pe_snr with(nolock)
			on pe_snr.exmpt_tax_yr = psa.owner_tax_yr
			and pe_snr.owner_tax_yr	= psa.owner_tax_yr
			and pe_snr.prop_id = psa.prop_id
			and pe_snr.sup_num = psa.sup_num
			and pe_snr.owner_id = o.owner_id
			and pe_snr.exmpt_type_cd = 'SNR/DSBL'
		where o.prop_id = psa.prop_id
			and o.sup_num = psa.sup_num
			and o.owner_tax_yr = psa.owner_tax_yr
	) then 1 else 0 end curr_senior_ex
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
    left outer join 
     wash_prop_owner_val_tax_vw as wpovTaxable with(nolock)
  on
    wpovTaxable.year = @year and
	wpovTaxable.year = psa.owner_tax_yr and
	wpovTaxable.sup_num = psa.sup_num and
	wpovTaxable.prop_id = psa.prop_id and
	wpovTaxable.tax_district_id = lb.tax_district_id and
	wpovTaxable.levy_cd = lb.levy_cd

	left outer join (
			select
			b.prop_id,
			levy.levy_cd,
			lb.tax_district_id,
			voted = case
				when levycurr.year is not null -- When the levy exists in the current year
				then isnull(levycurr.voted, 0) -- Use the current year voted flag
				else -- The levy does not exist in the current year
					isnull(levy.voted, 0) -- Use the previous year voted flag
			end,
			levy_rate = sum(case when (has_senior_ex = 1) and (isnull(levy.senior_levy_rate, 0) > 0)
				then isnull(levy.senior_levy_rate, 0) else isnull(levy.levy_rate, 0) end),
			prior_yr_tax_amount = sum(isnull(b.current_amount_due, 0)),
			isnull(levy_part,0) levy_part
		from bill as b with(nolock)
		join levy_bill as lb with(nolock) on
			lb.bill_id = b.bill_id
		join levy with(nolock) on
			levy.year = b.year and
			levy.tax_district_id = lb.tax_district_id and
			levy.levy_cd = lb.levy_cd and
			levy.include_in_levy_certification = 1 and
			isnull(levy.end_year, levy.year) >= levy.year
		left outer join levy as levycurr with(nolock) on -- Must left outer join, not inner join
		-- Because:  The levy may not exist in current year, but the tax district its for may exist in both, and we have to sum
			levycurr.year = @year and
			levycurr.tax_district_id = lb.tax_district_id and
			levycurr.levy_cd = lb.levy_cd and
			levycurr.include_in_levy_certification = 1 and
			isnull(levycurr.end_year, levycurr.year) >= levycurr.year
		inner join levy_type as lt with(nolock)
			on levy.levy_type_cd = lt.levy_type_cd	
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
		) prev_senior_check
		where b.year = (@prev_yr)
		group by
			b.prop_id,
			lb.tax_district_id,
			case
				when levycurr.year is not null -- When the levy exists in the current year
				then isnull(levycurr.voted, 0) -- Use the current year voted flag
				else -- The levy does not exist in the current year
					isnull(levy.voted, 0) -- Use the previous year voted flag
			end,
			isnull(levy_part,0) ,
			levy.levy_cd
	) prev 
	on prev.tax_district_id = levy.tax_district_id
	and prev.levy_cd = levy.levy_cd
	and prev.prop_id = wts.prop_id
	and prev.voted = levy.voted
	and prev.levy_part = lt.levy_part
		
	
SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus =  'Step 2 Start '

--This section of code is specifically to pull prior year values for display purposes only for levies that may not
--exist in the current year anymore TFS Bug 2209
create table #tmpPriorYearMissingLevy
(
	prop_id int null,
	sup_num int null,
	tax_district_id int null,
	voted int null,
	levy_rate numeric (14,10) null,
	prior_yr_tax_amount numeric (14,2) null,
	year int null,
	levy_cd varchar(10) null,
	levy_description varchar(50) null,
	statement_id int null,
	levy_part int
)	

insert into #tmpPriorYearMissingLevy
select
	b.prop_id,
	b.sup_num,
	lb.tax_district_id,
	voted = case
		when levycurr.year is not null
		then isnull(levycurr.voted, 0)
		else 
			isnull(levy.voted, 0)
		end,
	levy_rate = sum(case when (curr_senior_ex = 1) and (isnull(levycurr.senior_levy_rate, 0) > 0)
			then isnull(levycurr.senior_levy_rate, 0) else isnull(levycurr.levy_rate, 0) end),
	sum(isnull(b.current_amount_due, 0)) as prior_yr_tax_amount,
	levy.year,
	levy.levy_cd, 
	LEFT(isNull(levy.levy_description, ''), 32) as levy_description,
	null,
	levy_part
from bill as b with(nolock)
join levy_bill as lb with(nolock) on
	lb.bill_id = b.bill_id
join levy with(nolock) on
	levy.year = b.year and
	levy.tax_district_id = lb.tax_district_id and
	levy.levy_cd = lb.levy_cd and
	levy.include_in_levy_certification = 1 and
	isnull(levy.end_year, levy.year) >= levy.year
left outer join levy as levycurr with(nolock) on 
	levycurr.year = @year and
	levycurr.tax_district_id = lb.tax_district_id and
	levycurr.levy_cd = lb.levy_cd and
	levycurr.include_in_levy_certification = 1 and
	isnull(levycurr.end_year, levycurr.year) >= levycurr.year
inner join levy_type as lt with(nolock)
	on levy.levy_type_cd = lt.levy_type_cd	
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
			and psa.owner_tax_yr = @year
	) then 1 else 0 end curr_senior_ex
) senior_check
where b.year = @prev_yr
  and exists (select wtscb.prop_id 
                from #wa_tax_statement_calc_bill as wtscb 
               where	wtscb.prop_id = b.prop_id)
group by
	b.prop_id,
	b.sup_num,
	lb.tax_district_id,
	case
		when levycurr.year is not null 
		then isnull(levycurr.voted, 0)
		else
			isnull(levy.voted, 0)
	end,
	levy.year,
	levy.levy_cd,
	isNull(levy.levy_description, ''),
	levy_part


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '


update #tmpPriorYearMissingLevy
set statement_id = wts.statement_id
from #wa_tax_statement_calc_bill as wts with(nolock) 
where #tmpPriorYearMissingLevy.prop_id = wts.prop_id
-- don't need match on year,group,run,because #wa_tax_statement_calc_bill
-- contains only data for this run
--and wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id
-- if this update takes a while we might try putting an index on prop_id in both temp tables


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 4 Start '

insert into #wpovTaxable
(
  statement_id 
 ,prop_id
 ,sup_num 
 ,tax_district_id 
 ,levy_cd
 ,voted 
 ,levy_rate 
 ,current_amount_due 
 ,taxable 
 ,tax_wout_ex_amt
 ,levy_description
 ,prior_yr_tax_amount 
 ,levy_part
)
select distinct
statement_id,
prop_id,
sup_num, -- sup_num
tax_district_id,
levy_cd,
voted,
levy_rate,
0, -- current_amount_due
0, -- taxable
0, -- tax_wout_ex_amt
levy_description,
prior_yr_tax_amount,
levy_part

from #tmpPriorYearMissingLevy 
where not exists (
	select * from #wpovTaxable wpov 
	where wpov.statement_id = #tmpPriorYearMissingLevy.statement_id
	and wpov.tax_district_id = #tmpPriorYearMissingLevy.tax_district_id
	and wpov.levy_cd = #tmpPriorYearMissingLevy.levy_cd
)


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 5 Start '
				
-- Sum current year amounts - There can be more than one bill per levy, notably with rollback bills
select statement_id, tax_district_id, levy_cd, voted, levy_part, sum(current_amount_due) tax_amount
into #cad
from #wpovTaxable 
group by statement_id, tax_district_id, levy_cd, voted, levy_part

-- Combine the prior year amounts that will be grouped in tax statements, to match existing statement data.
-- The previous query gets one past tax amount for each levy and duplicates it onto each bill in that levy,
-- so remove the duplicates before summing and grouping
select statement_id, tax_district_id, voted, levy_part, sum(prior_yr_tax_amount) prior_yr_tax_amount 
into #pad
from (
	select distinct statement_id, tax_district_id, levy_cd, voted, levy_part, prior_yr_tax_amount from #wpovTaxable 
) prior_amount
group by statement_id, tax_district_id, voted, levy_part



insert wa_tax_statement_levy_details_display_current_run
(
	group_id,
	year,
	run_id,
	statement_id,
	tax_district_id,
	levy_cd,
	voted,
	levy_rate,
	tax_amount,
	gross_tax_amount,
	taxable_value,
	order_num,
	levy_description,
	prior_yr_tax_amount,
	levy_part
)

select
	@group_id group_id,
	@year year,
	@run_id run_id,
	w.statement_id,
	w.tax_district_id,
	w.levy_cd,
	w.voted,
	t.levy_rate,
	cad.tax_amount,
	t.gross_tax_amount,
	t.taxable_value,
	0 order_num,
	t.levy_description,
	pad.prior_yr_tax_amount,
	t.levy_part
from
(
	select distinct statement_id, tax_district_id, levy_cd, voted
	from #wpovTaxable
) w
cross apply (
	select top 1 w2.levy_rate, w2.tax_wout_ex_amt gross_tax_amount, isnull(w2.taxable, 0) taxable_value,
		left(isnull(w2.levy_description, ''), 32) levy_description, isnull(w2.levy_part, 0) levy_part
	from #wpovTaxable w2
	where w.statement_id = w2.statement_id
	and w.tax_district_id = w2.tax_district_id
	and w.levy_cd = w2.levy_cd
	and w.voted = w2.voted
) t
join #cad cad
	on cad.statement_id = w.statement_id
	and cad.tax_district_id = w.tax_district_id	
	and cad.levy_cd = w.levy_cd
	and cad.voted = w.voted
	and cad.levy_part = t.levy_part
join #pad pad
	on pad.statement_id = w.statement_id
	and pad.tax_district_id = w.tax_district_id	
	and pad.voted = w.voted
	and pad.levy_part = t.levy_part


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #wpovTaxable 
drop table #cad 
drop table #pad 
drop table #tmpPriorYearMissingLevy

	
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

