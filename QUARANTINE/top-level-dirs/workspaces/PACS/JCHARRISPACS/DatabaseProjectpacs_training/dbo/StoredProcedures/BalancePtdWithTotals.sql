
-- Create the procedure
CREATE procedure BalancePtdWithTotals
@pacs_user int,
@dataset_id bigint

as
--declare @pacs_user int
--declare @dataset_id bigint

--set @pacs_user = 1
--set @dataset_id = 67
 
declare @year as int
declare @sup_num as int


select distinct @year=year from ptd_mt_state_report where dataset_id=@dataset_id
select distinct @sup_num=as_of_sup_num from ptd_mt_state_report where dataset_id=@dataset_id

If object_id('tempdb..#tmp')  IS NOT NULL
Begin
	drop table #tmp
End 

If object_id('tempdb..#tmp2')  IS NOT NULL
Begin
	drop table #tmp2
End 

If object_id('tempdb..#tmp3')  IS NOT NULL
Begin
	drop table #tmp3
End 

If object_id('tempdb..#tmp4')  IS NOT NULL
Begin
	drop table #tmp4
End 

If object_id('tempdb..#tmp5')  IS NOT NULL
Begin
	drop table #tmp5
End 

delete from PtdExportBalanceSheet
where dataset_id = @dataset_id
-- Insert the records from totals 
select 
'TOTALS' as source, 
entity_id,
sum(ag_market + ag_market_ex + land_hstd_val + land_non_hstd_val +  timber_market + imprv_hstd_val + imprv_non_hstd_val + personal_val + mineral_val + auto_val) as market_val,
cast(0.0 as numeric(14)) as taxable_val,
sum(productivity_loss) as productivity_loss,
cast(0.0 as numeric(14)) as totally_exempt_amt,
cast(0 as int) as local_ov65_dp_cnt,
cast(0.0 as numeric(14)) as local_ov65_dp_amt,
cast(0 as int) as local_hs_cnt,
cast(0.0 as numeric(14)) as local_hs_amt,

cast(0 as int) as state_ov65_dp_cnt,
cast(0.0 as numeric(14)) as state_ov65_dp_amt,
cast(0 as int) as state_hs_cnt,
cast(0.0 as numeric(14)) as state_hs_amt,

cast(0 as int) as dv_cnt,
cast(0.0 as numeric(14)) as dv_amt,
cast(0 as int) as fr_cnt,
cast(0.0 as numeric(14)) as fr_amt,
cast(0 as int) as pc_cnt,
cast(0.0 as numeric(14)) as pc_amt,

cast(0 as int) as historical_cnt,
cast(0.0 as numeric(14)) as historical_amt,

cast(0 as int) as ab_cnt,
cast(0.0 as numeric(14)) as ab_amt,

sum(ten_percent_cap) as ten_percent_cap
into #tmp
from appraisal_totals
where pacs_user_id=@pacs_user and prop_val_yr = @year and arb_status in ('A' ,'C')
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id
order by entity_id

-- Calculate taxable value
select
entity_id, 
sum(land_hstd_val+land_non_hstd_val+ag_market+ag_market_ex+timber_market+timber_market_ex) +
sum(imprv_hstd_val+imprv_non_hstd_val) +
sum(personal_val+mineral_val+auto_val) -
sum(productivity_loss) -
sum(ten_percent_cap) as taxable_val
into #tmp4
from appraisal_totals 
where pacs_user_id = @pacs_user and arb_status in ('A','C')
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id

select
entity_id,
sum(exempt_local_amt + exempt_state_amt) as total_exemptions
into #tmp5
from appraisal_totals_exemptions
where pacs_user_id = @pacs_user and arb_status in ('A','C')
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id

update #tmp4 
set taxable_val = taxable_val - total_exemptions
from #tmp5
where #tmp5.entity_id=#tmp4.entity_id

update #tmp
set taxable_val = #tmp4.taxable_val
from #tmp4
where #tmp.entity_id = #tmp4.entity_id and source = 'TOTALS'

insert into #tmp
(
source,
entity_id,
market_val,
taxable_val,
productivity_loss,
totally_exempt_amt,
local_ov65_dp_cnt,
local_ov65_dp_amt,
local_hs_cnt,
local_hs_amt,

state_ov65_dp_cnt,
state_ov65_dp_amt,
state_hs_cnt,
state_hs_amt,

dv_cnt,
dv_amt,
fr_cnt,
fr_amt,
pc_cnt,
pc_amt,
historical_cnt,
historical_amt,
ab_cnt,
ab_amt,
ten_percent_cap
)
select
'PTD',
entity_id,
market_val,
taxable_val,
productivity_value_loss,
exempt_val+other_loss,
dp_local_option_loss_count+ov65_local_option_loss_count,
ov65_dp_local_option_loss_amt,
hs_local_option_loss_count,
hs_local_option_loss_amt,

ov65_state_loss_count+dp_state_loss_count,
ov65_dp_state_loss_amt,
hs_state_loss_count,
hs_state_loss_amt,

dv_loss_count,
dv_loss_amt,
freeport_loss_count,
freeport_loss_amt,
pollutioncontrol_loss_count,
pollutioncontrol_loss_amt,
historical_loss_count,
historical_loss,
abatement_loss_count,
abatement_loss,
hs_cap_loss
from ptd_mt_state_report
where dataset_id=@dataset_id

-- Totally exempt property amount
select
entity_id,
cast('EXT' as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
sum(exempt_state_amt)+sum(exempt_local_amt) as amt,
sum(exempt_local_amt) as local_amt,
sum(exempt_state_amt) as state_amt
into #tmp2
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and exempt_type_cd like 'EX%' and arb_status in ('A' ,'C')
and prop_val_yr=@year
group by entity_id
order by entity_id

select 
cast('EXT' as varchar(10)) as exempt_type_cd,
entity_id,
count(*) as cnt
into #tmp3
from property_entity_exemption
where exmpt_tax_yr=@year and sup_num=@sup_num and exmpt_type_cd like 'EX%' and (state_amt+local_amt) > 0.0
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id
order by entity_id

-- dv exempt property amount
insert into #tmp2
select
entity_id,
cast('DV' as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
sum(exempt_state_amt)+sum(exempt_local_amt) as amt,
sum(exempt_local_amt) as local_amt,
sum(exempt_state_amt) as state_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and exempt_type_cd like 'DV%' and arb_status in ('A' ,'C')
and prop_val_yr=@year
group by entity_id
order by entity_id

insert into #tmp3
select 
cast('DV' as varchar(10)) as exempt_type_cd,
entity_id,
count(*) as cnt
from property_entity_exemption
where exmpt_tax_yr=@year and sup_num=@sup_num and 
(exmpt_type_cd like 'DV%') and (state_amt +local_amt) > 0.0
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id
order by entity_id

-- dv exempt property amount
insert into #tmp2
select
entity_id,
cast(exempt_type_cd as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
sum(exempt_state_amt)+sum(exempt_local_amt) as amt,
sum(exempt_local_amt) as local_amt,
sum(exempt_state_amt) as state_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and exempt_type_cd in ('FR','PC','HT','AB') and arb_status in ('A' ,'C')
and prop_val_yr=@year
group by entity_id,exempt_type_cd
order by entity_id

-- ov65 + dp local property amount
insert into #tmp2
select
entity_id,
cast('OV65_DP' as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
0.0 as amt,
sum(exempt_local_amt) as local_amt,
0.0 as state_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and (exempt_type_cd like 'OV65%' or exempt_type_cd = 'DP') and arb_status in ('A' ,'C')
and exempt_local_amt > 0.0
and prop_val_yr=@year
group by entity_id
order by entity_id

-- ov65 + dp state property amount
insert into #tmp2
select
entity_id,
cast('S_OV65_DP' as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
0.0 as amt,
0.0 as local_amt,
sum(exempt_state_amt) as state_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and (exempt_type_cd like 'OV65%' or exempt_type_cd = 'DP') and arb_status in ('A' ,'C')
and exempt_state_amt > 0.0
and prop_val_yr=@year
group by entity_id
order by entity_id

insert into #tmp3
select 
cast('S_OV65_DP' as varchar(10)) as exempt_type_cd,
entity_id,
count(*) as cnt
from property_entity_exemption
where exmpt_tax_yr=@year and sup_num=@sup_num and 
(exmpt_type_cd like 'OV65%' or exmpt_type_cd = 'DP') and state_amt > 0.0
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id
order by entity_id


-- HS local property amount
insert into #tmp2
select
entity_id,
cast('HS_LOCAL' as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
0.0 as amt,
sum(exempt_local_amt) as local_amt,
0.0 as state_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and (exempt_type_cd = 'HS') and arb_status in ('A' ,'C')
and exempt_local_amt > 0.0
and prop_val_yr=@year
group by entity_id
order by entity_id

insert into #tmp3
select 
cast('HS_LOCAL' as varchar(10)) as exempt_type_cd,
entity_id,
count(*) as cnt
from property_entity_exemption
where exmpt_tax_yr=@year and sup_num=@sup_num and exmpt_type_cd = 'HS' and local_amt > 0.0
and entity_id in (select entity_id from ptd_mt_state_report where dataset_id=@dataset_id)
group by entity_id
order by entity_id


-- HS state property amount
insert into #tmp2
select
entity_id,
cast('HS_STATE' as varchar(10)) as exempt_type_cd,
sum(exempt_count) as cnt,
0.0 as amt,
0.0 as local_amt,
sum(exempt_state_amt) as state_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and (exempt_type_cd = 'HS') and arb_status in ('A' ,'C')
and exempt_state_amt > 0.0
and prop_val_yr=@year
group by entity_id
order by entity_id

-- Update the counts
update #tmp2
set #tmp2.cnt = #tmp3.cnt
from #tmp3
where #tmp2.entity_id=#tmp3.entity_id and #tmp2.exempt_type_cd=#tmp3.exempt_type_cd 

update #tmp
set totally_exempt_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='EXT'

update #tmp
set
dv_cnt=#tmp2.cnt,
dv_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd like 'DV%'

update #tmp
set
fr_cnt=#tmp2.cnt,
fr_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'FR'

update #tmp
set
historical_cnt=#tmp2.cnt,
historical_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'HT'

update #tmp
set
ab_cnt=#tmp2.cnt,
ab_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'AB'

update #tmp
set
pc_cnt=#tmp2.cnt,
pc_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'PC'


update #tmp
set local_ov65_dp_cnt=#tmp2.cnt,
local_ov65_dp_amt=#tmp2.local_amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='OV65_DP'

update #tmp
set state_ov65_dp_cnt=#tmp2.cnt,
state_ov65_dp_amt=#tmp2.state_amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='S_OV65_DP'


update #tmp
set local_hs_cnt=#tmp2.cnt,
local_hs_amt=#tmp2.local_amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='HS_LOCAL'

update #tmp
set state_hs_cnt=#tmp2.cnt,
state_hs_amt=#tmp2.state_amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='HS_STATE'



-- Insert the difference records, for each entity there is one record from
-- totals and one from ptd, this query will add a difference record subtracting
-- the ptd values from the totals value.
insert into #tmp
select
'DIFF' as source, 
entity_id,
sum(case when source = 'TOTALS' then market_val else - market_val end) as market_val,
sum(case when source = 'TOTALS' then taxable_val else - taxable_val end) as taxable_val,
sum(case when source = 'TOTALS' then productivity_loss else - productivity_loss end) as productivity_loss,
sum(case when source = 'TOTALS' then totally_exempt_amt else - totally_exempt_amt end) as totally_exempt_amt,
sum(case when source = 'TOTALS' then local_ov65_dp_cnt else - local_ov65_dp_cnt end) as local_ov65_dp_cnt,
sum(case when source = 'TOTALS' then local_ov65_dp_amt else - local_ov65_dp_amt end) as local_ov65_dp_amt,
sum(case when source = 'TOTALS' then local_hs_cnt else - local_hs_cnt end) as local_hs_cnt,
sum(case when source = 'TOTALS' then local_hs_amt else - local_hs_amt end) as local_hs_amt,

sum(case when source = 'TOTALS' then state_ov65_dp_cnt else - state_ov65_dp_cnt end) as state_ov65_dp_cnt,
sum(case when source = 'TOTALS' then state_ov65_dp_amt else - state_ov65_dp_amt end) as state_ov65_dp_amt,
sum(case when source = 'TOTALS' then state_hs_cnt else - state_hs_cnt end) as state_hs_cnt,
sum(case when source = 'TOTALS' then state_hs_amt else - state_hs_amt end) as state_hs_amt,

sum(case when source = 'TOTALS' then dv_cnt else - dv_cnt end) as dv_cnt,
sum(case when source = 'TOTALS' then dv_amt else - dv_amt end) as dv_amt,
sum(case when source = 'TOTALS' then fr_cnt else - fr_cnt end) as fr_cnt,
sum(case when source = 'TOTALS' then fr_amt else - fr_amt end) as fr_amt,
sum(case when source = 'TOTALS' then pc_cnt else - pc_cnt end) as pc_cnt,
sum(case when source = 'TOTALS' then pc_amt else - pc_amt end) as pc_amt,

sum(case when source = 'TOTALS' then historical_cnt else - historical_cnt end) as historical_cnt,
sum(case when source = 'TOTALS' then historical_amt else - historical_amt end) as historical_amt,

sum(case when source = 'TOTALS' then ab_cnt else - ab_cnt end) as ab_cnt,
sum(case when source = 'TOTALS' then ab_amt else - ab_amt end) as ab_amt,

sum(case when source = 'TOTALS' then ten_percent_cap else - ten_percent_cap end) as ten_percent_cap
from #tmp
group by entity_id
order by entity_id

insert into PtdExportBalanceSheet
(
source, 
entity_id,
file_as_name,
entity_type_cd,
market_val,
taxable_val_before_school_limit,
productivity_loss,
totally_exempt_amt,
local_ov65_dp_cnt,
local_ov65_dp_amt,
local_hs_cnt,
local_hs_amt,

state_ov65_dp_cnt,
state_ov65_dp_amt,
state_hs_cnt,
state_hs_amt,

dv_cnt,
dv_amt,
fr_cnt,
fr_amt,
pc_cnt,
pc_amt,

historical_cnt,
historical_amt,

ab_cnt,
ab_amt,

ten_percent_cap,
dataset_id
)
select
#tmp.source, 
#tmp.entity_id,
file_as_name,
entity_type_cd,
market_val,
case when entity_type_cd ='A' then 0 else taxable_val end,
productivity_loss,
totally_exempt_amt,
local_ov65_dp_cnt,
local_ov65_dp_amt,
local_hs_cnt,
local_hs_amt,

state_ov65_dp_cnt,
state_ov65_dp_amt,
state_hs_cnt,
state_hs_amt,

dv_cnt,
dv_amt,
fr_cnt,
fr_amt,
pc_cnt,
pc_amt,

historical_cnt,
historical_amt,
ab_cnt,
ab_amt,
ten_percent_cap,
@dataset_id
from #tmp
inner join account on #tmp.entity_id=acct_id
inner join entity as en on en.entity_id = #tmp.entity_id
order by #tmp.entity_id,#tmp.source

drop table #tmp
drop table #tmp2
drop table #tmp3
drop table #tmp4
drop table #tmp5

GO

