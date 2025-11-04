
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_owner_current_run 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_owner_current_run
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@pacs_user_name varchar(30), 
	@effective_date datetime,	 
	@owner_statement_count int output
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
 + ' @run_id =' +  convert(varchar(30),@run_id)  + ','
 + ' @pacs_user_name =' +  isnull(@pacs_user_name,'') + ',' 
 + ' @effective_date =' +  convert(varchar(30),@effective_date)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

BEGIN TRY

-- wa_tax_statement_owner
insert wa_tax_statement_owner_current_run
   (group_id, year, run_id, owner_id, owner_name, 
	total_taxable_value, voter_approved_tax_amount, 
	half_tax_amount, half_penalty_amount, half_interest_amount, half_total_due,
	full_tax_amount, full_penalty_amount, full_interest_amount, full_total_due,
	prior_year_0_tax_amount, prior_year_0_interest, prior_year_0_penalty,
	prior_year_1_tax_amount, prior_year_1_interest, prior_year_1_penalty,
	prior_year_delq_tax_amount, prior_year_delq_interest, prior_year_delq_penalty,
	delinquent_tax_amount, delinquent_interest, delinquent_penalty, delinquent_total_due,
	total_due, gross_tax, generated_by )
select @group_id, @year, @run_id, wts.owner_id, wts.owner_name,
	sum(isNull(wts.current_year_value, 0)), sum(isNull(wts.comparison_voted_sum_curr_taxes, 0)), 
	sum(isNull(wts.half_tax_amount, 0)), sum(isNull(wts.half_penalty_amount, 0)), 
	sum(isNull(wts.half_interest_amount, 0)), sum(isNull(wts.half_total_due, 0)), 
	sum(isNull(wts.full_tax_amount, 0)), sum(isNull(wts.full_penalty_amount, 0)), 
	sum(isNull(wts.full_interest_amount, 0)), sum(isNull(wts.full_total_due, 0)), 
	sum(isNull(wts.prior_year_0_tax_amount, 0)), sum(isNull(wts.prior_year_0_interest, 0)), sum(isNull(wts.prior_year_0_penalty, 0)), 
	sum(isNull(wts.prior_year_1_tax_amount, 0)), sum(isNull(wts.prior_year_1_interest, 0)), sum(isNull(wts.prior_year_1_penalty, 0)), 
	sum(isNull(wts.prior_year_delq_tax_amount, 0)), sum(isNull(wts.prior_year_delq_interest, 0)), sum(isNull(wts.prior_year_delq_penalty, 0)), 
	sum(isNull(wts.delinquent_tax_amount, 0)), sum(isNull(wts.delinquent_interest_amount, 0)), 
	sum(isNull(wts.delinquent_penalty_amount, 0)), sum(isNull(wts.delinquent_total_due, 0)), sum(isNull(wts.total_due, 0)), 
	sum(isNull(wts.comparison_voted_sum_curr_taxes, 0) + isNull(wts.comparison_nonvoted_sum_curr_taxes, 0)),
	@pacs_user_name
from wa_tax_statement_current_run wts with (nolock)
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and isnull(wts.agent_id, 0) = 0 
and isnull(wts.mortgage_co_id, 0) = 0 
and isnull(wts.taxserver_id, 0) = 0
group by wts.owner_id, wts.owner_name

set @owner_statement_count = @@rowcount

SELECT @LogTotRows = @owner_statement_count,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 2 Start '	

-- property count and show half pay line
update wtso 
set		
	property_count = tmp.propCount
from wa_tax_statement_owner_current_run wtso
join (select	group_id, run_id, year, owner_id,
				count(distinct prop_id) propCount
				from wa_tax_statement_current_run with (nolock)
				where isnull(agent_id, 0) = 0 and isnull(mortgage_co_id, 0) = 0
				 and isnull(taxserver_id, 0) = 0
				group by group_id, run_id, year, owner_id ) tmp on
	wtso.group_id = tmp.group_id and
	wtso.run_id = tmp.run_id and
	wtso.year = tmp.year  and
	wtso.owner_id = tmp.owner_id		
where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id

SELECT @LogTotRows = @owner_statement_count,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 3 Start '	
		
update wtso 
set	
	show_half_pay_line = 1
from wa_tax_statement_owner_current_run wtso		
join wa_tax_statement_current_run wts with (nolock) on 
	wtso.group_id = wts.group_id and
	wtso.run_id = wts.run_id and
	wtso.year = wts.year  and
	wtso.owner_id = wts.owner_id		
where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id
and isnull(wts.agent_id, 0) = 0 and isnull(wts.mortgage_co_id, 0) = 0 and isnull(wts.taxserver_id, 0) = 0
and isNull(wts.show_half_pay_line, 0) = 1

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 4 Start '	

-- due dates
update wtso 
set		
		half_due_date = case when wtsc.effective_date = 1 then @effective_date else wts.due_date end,
		full_due_date = wts.full_tax_due_date
from wa_tax_statement_owner_current_run wtso 
join ( 
	select	owner_id, year, run_id, group_id,
			min(due_date) due_date, max(full_tax_due_date) full_tax_due_date
	from wa_tax_statement_current_run with (nolock)
	where isnull(agent_id, 0) = 0 and isnull(mortgage_co_id, 0) = 0 and isnull(taxserver_id, 0) = 0
	group by owner_id, year, run_id, group_id 
) wts on  
	wtso.group_id = wts.group_id and
	wtso.run_id = wts.run_id and
	wtso.year = wts.year  and
	wtso.owner_id = wts.owner_id
join wa_tax_statement_config wtsc with (nolock)  on
	wtso.year = wtsc.year  and
	wtsc.statement_option = 2

where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 5 Start '	

-- address
update wtso
set
	wtso.addr_line1 = addr.addr_line1,
	wtso.addr_line2 = addr.addr_line2,
	wtso.addr_line3 = addr.addr_line3,
	wtso.carrier_route = addr.carrier_route,
	wtso.addr_city = addr.addr_city,
	wtso.addr_state = addr.addr_state,
	wtso.addr_zip = addr.addr_zip,
	wtso.addr_country = case	when isNull(country.country_name, '') = '' then addr.country_cd 
									else country.country_name end,
	wtso.addr_is_deliverable = case
		when IsNull(addr.ml_deliverable, 'T') in ('T','Y')
		then 1
		else 0
	end,
	wtso.addr_is_international = addr.is_international
from wa_tax_statement_owner_current_run as wtso
join address as addr with(nolock) on
	addr.acct_id = wtso.owner_id and
	isNull(addr.primary_addr, 'N') = 'Y'
left join country with (nolock) on
	country.country_cd = addr.country_cd
where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 6 Start '	

-- tax district data

create table #tmpOwnerTD 
(	owner_id int, tax_amount numeric(18, 2), tax_district_type_cd varchar(10), 
	tax_district_type_desc varchar(50), priority int, order_num int identity(1,1),
	levy_part int
)


insert into #tmpOwnerTD (owner_id, tax_district_type_cd, tax_district_type_desc, priority, tax_amount, levy_part)
select wts.owner_id, tdt.tax_district_type_cd, 
case when wtsl.levy_part <> 2 then	isnull(tdt.tax_district_desc,'OTHER')
	else (select levy_type_desc from levy_type where levy_part = 2)
end tax_district_desc,
isNull(tdt.priority, 999), sum(isNull(wtsl.tax_amount, 0)), wtsl.levy_part
from wa_tax_statement_current_run wts with (nolock)
join wa_tax_statement_levy_current_run wtsl with (nolock)
 on
	wts.group_id = wtsl.group_id and
	wts.year = wtsl.year and
	wts.run_id = wtsl.run_id and
	wts.statement_id = wtsl.statement_id
join tax_district td with (nolock) on 
	wtsl.tax_district_id = td.tax_district_id 
join tax_district_type tdt with (nolock) on
	td.tax_district_type_cd = tdt.tax_district_type_cd
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and isnull(wts.agent_id, 0) = 0
and isnull(wts.mortgage_co_id, 0) = 0
and isnull(wts.taxserver_id, 0) = 0
group by  wts.owner_id, tdt.tax_district_type_cd,
 tdt.tax_district_desc, isNull(tdt.priority, 999), wtsl.levy_part
order by wts.owner_id, isNull(tdt.priority, 999)

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

create clustered index idx_tmpOwnerTD on #tmpOwnerTD(owner_id)

set @StartStep = getdate()
SET @LogStatus = 'Step 7 Start '	


insert into wa_tax_statement_owner_distribution_current_run
 (	year, group_id, run_id, owner_id )
select distinct @year, @group_id, @run_id, owner_id from #tmpOwnerTD

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 8 Start '	

create table #tmpOwnerMinIDs (owner_id int, minID int)

insert into #tmpOwnerMinIDs (owner_id, minID)
select owner_id, min(order_num)
from #tmpOwnerTD 
group by owner_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

create clustered index idx_tmpOwnerTDMinIDs on #tmpOwnerMinIDs(owner_id)

set @StartStep = getdate()
SET @LogStatus = 'Step 9 Start '	

----------update tax district totals
update wtso
		 set td_code01 = isNull(tmp1.tax_district_type_cd, '')
		,td_desc01 = isNull(tmp1.tax_district_type_desc, '')
		,td_full_total_01 = isNull(tmp1.tax_amount, 0)

		,td_code02 = isNull(tmp2.tax_district_type_cd, '')
		,td_desc02 = isNull(tmp2.tax_district_type_desc, '')
		,td_full_total_02 = isNull(tmp2.tax_amount, 0)
		
		,td_code03 = isNull(tmp3.tax_district_type_cd, '')
		,td_desc03 = isNull(tmp3.tax_district_type_desc, '')
		,td_full_total_03 = isNull(tmp3.tax_amount, 0)

		,td_code04 = isNull(tmp4.tax_district_type_cd, '')
		,td_desc04 = isNull(tmp4.tax_district_type_desc, '')
		,td_full_total_04 = isNull(tmp4.tax_amount, 0)

		,td_code05 = isNull(tmp5.tax_district_type_cd, '')
		,td_desc05 = isNull(tmp5.tax_district_type_desc, '')
		,td_full_total_05 = isNull(tmp5.tax_amount, 0)

		,td_code06 = isNull(tmp6.tax_district_type_cd, '')
		,td_desc06 = isNull(tmp6.tax_district_type_desc, '')
		,td_full_total_06 = isNull(tmp6.tax_amount, 0)

		,td_code07 = isNull(tmp7.tax_district_type_cd, '')
		,td_desc07 = isNull(tmp7.tax_district_type_desc, '')
		,td_full_total_07 = isNull(tmp7.tax_amount, 0)

		,td_code08 = isNull(tmp8.tax_district_type_cd, '')
		,td_desc08 = isNull(tmp8.tax_district_type_desc, '')
		,td_full_total_08 = isNull(tmp8.tax_amount, 0)

		,td_code09 = isNull(tmp9.tax_district_type_cd, '')
		,td_desc09 = isNull(tmp9.tax_district_type_desc, '')
		,td_full_total_09 = isNull(tmp9.tax_amount, 0)

		,td_code10 = isNull(tmp10.tax_district_type_cd, '')
		,td_desc10 = isNull(tmp10.tax_district_type_desc, '')
		,td_full_total_10 = isNull(tmp10.tax_amount, 0)

		,td_code11 = 'OTHER'
		,td_desc11 = 'OTHER'
		,td_full_total_11  = isNull(tmpOther.total_tax_amount, 0)

from wa_tax_statement_owner_distribution_current_run wtso
join #tmpOwnerMinIDs orders on orders.owner_id = wtso.owner_id

left join #tmpOwnerTD tmp1 on tmp1.owner_id = wtso.owner_id
	and tmp1.order_num = minID
left join #tmpOwnerTD tmp2 on tmp2.owner_id = wtso.owner_id
	and tmp2.order_num = minID+1
left join #tmpOwnerTD tmp3 on tmp3.owner_id = wtso.owner_id
	and tmp3.order_num = minID+2
left join #tmpOwnerTD tmp4 on tmp4.owner_id = wtso.owner_id
	and tmp4.order_num = minID+3
left join #tmpOwnerTD tmp5 on tmp5.owner_id = wtso.owner_id
	and tmp5.order_num = minID+4
left join #tmpOwnerTD tmp6 on tmp6.owner_id = wtso.owner_id
	and tmp6.order_num = minID+5
left join #tmpOwnerTD tmp7 on tmp7.owner_id = wtso.owner_id
	and tmp7.order_num = minID+6
left join #tmpOwnerTD tmp8 on tmp8.owner_id = wtso.owner_id
	and tmp8.order_num = minID+7
left join #tmpOwnerTD tmp9 on tmp9.owner_id = wtso.owner_id
	and tmp9.order_num = minID+8
left join #tmpOwnerTD tmp10 on tmp10.owner_id = wtso.owner_id
	and tmp10.order_num = minID+9
--sum up the rest, if any
left join (	select sum(isNull(tax_amount, 0)) total_tax_amount, t1.owner_id
			from #tmpOwnerTD t1
			join #tmpOwnerMinIDs t2 on t1.owner_id = t2.owner_id 
			where order_num >= minID + 10
			group by t1.owner_id ) tmpOther on tmpOther.owner_id = wtso.owner_id
where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()

SET @LogStatus = 'Step 10 Start '	

truncate table #tmpOwnerMinIDs

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

-------------------special assessment data
set @StartStep = getdate()
SET @LogStatus = 'Step 11 Start '	

create table #tmpOwnerSA 
(
  owner_id int
, item_desc varchar(60)
, agency_id int
, tax_amount numeric(18, 2)
, order_num int identity(1,1))

insert into #tmpOwnerSA (owner_id, item_desc, agency_id, tax_amount) 
select	wts.owner_id, wtsa.item_desc, isNull(wtsa.agency_id, 99999999),
		sum(isNull(wtsa.assessment_fee_amount, 0))
from wa_tax_statement_assessment_fee_display_current_run wtsa with (nolock)
join wa_tax_statement_current_run wts with (nolock)
 on 
	wts.group_id = wtsa.group_id and
	wts.year = wtsa.year and
	wts.run_id = wtsa.run_id and
	wts.statement_id = wtsa.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and isnull(wts.agent_id, 0) = 0 and isnull(wts.mortgage_co_id, 0) = 0 and isnull(wts.taxserver_id, 0) = 0
group by wts.owner_id, wtsa.item_desc, isNull(wtsa.agency_id, 99999999)
order by wts.owner_id, isNull(wtsa.agency_id, 99999999), wtsa.item_desc

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

create clustered index idx_tmpOwnerSA on #tmpOwnerSA(owner_id)

set @StartStep = getdate()
SET @LogStatus = 'Step 12 Start '	

insert into #tmpOwnerMinIDs (owner_id, minID)
select owner_id, min(order_num)
from #tmpOwnerSA 
group by owner_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 13 Start '	

insert into wa_tax_statement_owner_distribution_current_run
 (	year, group_id, run_id, owner_id )
select distinct @year, @group_id, @run_id, tmp.owner_id 
from #tmpOwnerSA tmp
left join wa_tax_statement_owner_distribution_current_run wtso 
on 
	wtso.group_id = @group_id and
	wtso.year = @year and
	wtso.run_id = @run_id and
	wtso.owner_id = tmp.owner_id
where wtso.owner_id IS NULL

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 14 Start '	

update wtso
		 set af_desc01 = isNull(tmp1.item_desc, '')
		,af_full_total_01 = isNull(tmp1.tax_amount, 0)

		,af_desc02 = isNull(tmp2.item_desc, '')
		,af_full_total_02 = isNull(tmp2.tax_amount, 0)
		
		,af_desc03 = isNull(tmp3.item_desc, '')
		,af_full_total_03 = isNull(tmp3.tax_amount, 0)

		,af_desc04 = isNull(tmp4.item_desc, '')
		,af_full_total_04 = isNull(tmp4.tax_amount, 0)

		,af_desc05 = isNull(tmp5.item_desc, '')
		,af_full_total_05 = isNull(tmp5.tax_amount, 0)

		,af_desc06 = isNull(tmp6.item_desc, '')
		,af_full_total_06 = isNull(tmp6.tax_amount, 0)

		,af_desc07 = 'OTHER'
		,af_full_total_07  = isNull(tmpOther.total_tax_amount, 0)

from wa_tax_statement_owner_distribution_current_run wtso
join #tmpOwnerMinIDs orders on orders.owner_id = wtso.owner_id

left join #tmpOwnerSA tmp1 on tmp1.owner_id = wtso.owner_id
	and tmp1.order_num = minID
left join #tmpOwnerSA tmp2 on tmp2.owner_id = wtso.owner_id
	and tmp2.order_num = minID+1
left join #tmpOwnerSA tmp3 on tmp3.owner_id = wtso.owner_id
	and tmp3.order_num = minID+2
left join #tmpOwnerSA tmp4 on tmp4.owner_id = wtso.owner_id
	and tmp4.order_num = minID+3
left join #tmpOwnerSA tmp5 on tmp5.owner_id = wtso.owner_id
	and tmp5.order_num = minID+4
left join #tmpOwnerSA tmp6 on tmp6.owner_id = wtso.owner_id
	and tmp6.order_num = minID+5

--sum up the rest, if any
left join (	select sum(tax_amount) total_tax_amount, t1.owner_id
			from #tmpOwnerSA t1
			join #tmpOwnerMinIDs t2 on t1.owner_id = t2.owner_id 
			where order_num >= minID + 6
			group by t1.owner_id ) tmpOther on tmpOther.owner_id = wtso.owner_id
where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id	

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


----------------------------
-- BEGIN - OCR scanline text
----------------------------

set @StartStep = getdate()
SET @LogStatus = 'Step 15 Start '	

-- All scanlines have the group ID, owner ID, full due, & half due
update wts
set wts.scanline =
	replicate('0', 10 - len(convert(varchar(10), group_id))) + convert(varchar(10), group_id)
	+
	replicate('0', 10 - len(convert(varchar(10), owner_id))) + convert(varchar(10), owner_id)
	+
	replicate('0', 10 - len(replace(convert(varchar(11), full_total_due), '.', ''))) + replace(convert(varchar(11), full_total_due), '.', '')
	+
	replicate('0', 10 - len(replace(convert(varchar(10), (half_tax_amount + half_interest_amount + half_penalty_amount)), '.', ''))) + replace(convert(varchar(10), (half_tax_amount + half_interest_amount + half_penalty_amount)), '.', ''),
wts.scanline2 = 
	replicate('0', 10 - len(convert(varchar(10), group_id))) + convert(varchar(10), group_id)
	+
	replicate('0', 10 - len(convert(varchar(10), owner_id))) + convert(varchar(10), owner_id)
	+
	--for second half, the "full amount" is the remaining amount, and the "half amount" is 0
	replicate('0', 10 - len(replace(convert(varchar(11), full_tax_amount - half_tax_amount), '.', ''))) + replace(convert(varchar(11), full_tax_amount - half_tax_amount), '.', '')
	+
	replicate('0', 10)
from wa_tax_statement_owner_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 16 Start '	
	
-- Add the delinquent amounts due to the statements that have a delinquent amount due
update wts
set wts.scanline = wts.scanline +
	replicate('0', 10 - len(replace(convert(varchar(11), prior_year_0_tax_amount + prior_year_0_interest + prior_year_0_penalty), '.', ''))) + replace(convert(varchar(11), prior_year_0_tax_amount + prior_year_0_interest + prior_year_0_penalty), '.', '')
	+
	replicate('0', 10 - len(replace(convert(varchar(11), prior_year_1_tax_amount + prior_year_1_interest + prior_year_1_penalty), '.', ''))) + replace(convert(varchar(11), prior_year_1_tax_amount + prior_year_1_interest + prior_year_1_penalty), '.', '')
	+
	replicate('0', 10 - len(replace(convert(varchar(11), prior_year_delq_tax_amount + prior_year_delq_interest + prior_year_delq_penalty), '.', ''))) + replace(convert(varchar(11), prior_year_delq_tax_amount + prior_year_delq_interest + prior_year_delq_penalty), '.', ''),
wts.scanline2 = wts.scanline2 +
	replicate('0', 30) --assumes all delinquent/prior amounts paid in first half
from wa_tax_statement_owner_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 17 Start '	

		
-- Add the check digit and the PACS identifier '9'
update wts
set wts.scanline = wts.scanline + dbo.fn_CheckDigitMod10(wts.scanline) + '9',
wts.scanline2 = wts.scanline2 + dbo.fn_CheckDigitMod10(wts.scanline2) + '9'
from wa_tax_statement_owner_current_run as wts
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

--------------------------
-- END - OCR scanline text
--------------------------


----------------------------
-- BEGIN - Determine message code for each statement
----------------------------

set @StartStep = getdate()
SET @LogStatus = 'Step 18 Start '

DECLARE @TaxpayerMessage varchar(525)

select @TaxpayerMessage = message from wa_tax_statement_config where statement_option = 2 and year = @year

update wa_tax_statement_run 
set	
	message = @TaxpayerMessage
where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

--------------------------
-- END - Determine message code for each statement
--------------------------

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

