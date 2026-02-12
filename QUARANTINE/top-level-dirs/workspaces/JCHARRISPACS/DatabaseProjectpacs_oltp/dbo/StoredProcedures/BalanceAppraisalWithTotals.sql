
-- Create the procedure
CREATE procedure BalanceAppraisalWithTotals
@pacs_user int,
@dataset_id bigint,
@year as int,
@inc_prop_in_arb as bit = 1
as

--declare @pacs_user int
--declare @dataset_id bigint
--declare @year int
-- 193,56,2004
--set @pacs_user=193
--set @dataset_id=56
--set @year=2004
declare @inc_arb as char(1)

-- Optional to include properties in ARB
if @inc_prop_in_arb = 1 
begin
	set @inc_arb = 'A'
end
else
begin
	set @inc_arb = 'C'
end

If object_id('tempdb..#tmp')  IS NOT NULL
Begin
	drop table #tmp
End 

If object_id('tempdb..#tmp2')  IS NOT NULL
Begin
	drop table #tmp2
End 
IF object_id('AppraisalExportBalanceSheet')  IS NOT NULL
Begin
		Drop table AppraisalExportBalanceSheet
End
--IF object_id('AppraisalExportBalanceSheet')  IS NULL
--Begin
CREATE TABLE [AppraisalExportBalanceSheet] (
	[source] [varchar] (6) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[entity_id] [int] NOT NULL ,
	[prop_count] [numeric](38, 0) NULL ,
	[land_hstd_val] [numeric](38, 0) NULL ,
	[land_non_hstd_val] [numeric](38, 0) NULL ,
	[imprv_hstd_val] [numeric](38, 0) NULL ,
	[imprv_non_hstd_val] [numeric](38, 0) NULL ,
	[personal_prop_count] [numeric](38, 0) NULL ,
	[personal_val] [numeric](38, 0) NULL ,
	[mineral_prop_count] [numeric](38, 0) NULL ,
	[mineral_val] [numeric](38, 0) NULL ,
	[auto_prop_count] [numeric](38, 0) NULL ,
	[auto_val] [numeric](38, 0) NULL ,
	[ag_market] [numeric](38, 0) NULL ,
	[timber_market] [numeric](38, 0) NULL ,
	[ag_use] [numeric](38, 0) NULL ,
	[timber_use] [numeric](38, 0) NULL ,

	[ag_market_ex] [numeric](38, 0) NULL ,
	[timber_market_ex] [numeric](38, 0) NULL ,
	[ag_use_ex] [numeric](38, 0) NULL ,
	[timber_use_ex] [numeric](38, 0) NULL ,

	[hs_count] [int] NOT NULL ,
	[hs_local_amt] [numeric](38, 0) NULL ,
	[hs_state_amt] [numeric](38, 0) NULL ,
	[dv_count] [int] NOT NULL ,
	[dv_amt] [numeric](38, 0) NULL ,
	[dp_count] [int] NOT NULL ,
	[dp_amt] [numeric](38, 0) NULL ,
	[ex_count] [int] NOT NULL ,
	[ex_amt] [numeric](38, 0) NULL ,
	[ov65_count] [int] NOT NULL ,
	[ov65_amt] [numeric](38, 0) NULL ,
	[ab_count] [int] NOT NULL ,
	[ab_amt] [numeric](38, 0) NULL ,
	[fr_count] [int] NOT NULL ,
	[fr_amt] [numeric](38, 0) NULL ,
	[pc_count] [int] NOT NULL ,
	[pc_amt] [numeric](38, 0) NULL ,
	[ex366_count] [int] NOT NULL ,
	[ex366_amt] [numeric](38, 0) NULL ,
	[ht_count] [int] NOT NULL ,
	[ht_amt] [numeric](38, 0) NULL ,
	[so_count] [int] NOT NULL ,
	[so_amt] [numeric](38, 0) NULL ,
	[ch_count] [int] NOT NULL ,
	[ch_amt] [numeric](38, 0) NULL ,
	[lve_count] [int] NOT NULL ,
	[lve_amt] [numeric](38, 0) NULL ,
	[en_count] [int] NOT NULL ,
	[en_amt] [numeric](38, 0) NULL ,
	[hs_cap] [numeric](38, 0) NULL ,
	[market_val] [numeric](38, 0) NULL ,
	[taxable_val] [numeric](38, 0) NULL ,
	[productivity_loss] [numeric](38, 0) NULL ,
	[dataset_id] [bigint] NOT NULL 
) ON [PRIMARY]

--End

-- Delete any records that already exist for this dataset_id
delete from AppraisalExportBalanceSheet
where dataset_id = @dataset_id

-- Insert the records from totals 
select 
'TOTALS' as source, 
entity_id,
sum(prop_count) as prop_count,
sum(land_hstd_val) as land_hstd_val,
sum(land_non_hstd_val) as land_non_hstd_val,
sum(imprv_hstd_val) as imprv_hstd_val,
sum(imprv_non_hstd_val) as imprv_non_hstd_val,
sum(personal_prop_count) as personal_prop_count,
sum(personal_val) as personal_val,
sum(mineral_prop_count) as mineral_prop_count,
sum(mineral_val) as mineral_val,
sum(auto_prop_count) as auto_prop_count,
sum(auto_val) as auto_val,

sum(ag_market) as ag_market,
sum(timber_market) as timber_market,
sum(ag_use) as ag_use,
sum(timber_use) as timber_use,

sum(ag_market_ex) as ag_market_ex,
sum(timber_market_ex) as timber_market_ex,
sum(ag_use_ex) as ag_use_ex,
sum(timber_use_ex) as timber_use_ex,

0 as hs_count,
cast(0.0 as numeric(38,0)) as hs_local_amt,
cast(0.0 as numeric(38,0)) as hs_state_amt,
0 as dv_count,
cast(0.0 as numeric(38,0)) as dv_amt,
0 as dp_count,
cast(0.0 as numeric(38,0)) as dp_amt,
0 as ex_count,
cast(0.0 as numeric(38,0)) as ex_amt,

0 as ov65_count,
cast(0.0 as numeric(38,0)) as ov65_amt,
0 as ab_count,
cast(0.0 as numeric(38,0)) as ab_amt,
0 as fr_count,
cast(0.0 as numeric(38,0)) as fr_amt,
0 as pc_count,
cast(0.0 as numeric(38,0)) as pc_amt,
0 as ex366_count,
cast(0.0 as numeric(38,0)) as ex366_amt,
0 as ht_count,
cast(0.0 as numeric(38,0)) as ht_amt,
0 as so_count,
cast(0.0 as numeric(38,0)) as so_amt,
0 as ch_count,
cast(0.0 as numeric(38,0)) as ch_amt,
0 as lve_count,
cast(0.0 as numeric(38,0)) as lve_amt,
0 as en_count,
cast(0.0 as numeric(38,0)) as en_amt,
sum(land_hstd_val)+sum(land_non_hstd_val)+sum(imprv_hstd_val)+sum(imprv_non_hstd_val)+sum(personal_val)+sum(mineral_val)+sum(auto_val)+sum(ag_market)+sum(ag_market_ex)+sum(timber_market)+sum(timber_market_ex) as market_val,
(sum(ag_market)-sum(ag_use))+(sum(timber_market)-sum(timber_use)) as productivity_loss,

cast(0.0 as numeric(38,0)) as taxable_val,
sum(ten_percent_cap) as hs_cap
into #tmp
from appraisal_totals
where pacs_user_id=@pacs_user and arb_status in ('C', @inc_arb) 
and prop_val_yr=@year
group by entity_id
order by entity_id

-- Insert the records from the appraisal export
insert into #tmp
select 
'EXPORT' as source, 
entity_id,
num_records as prop_count,
land_hstd_val,
land_non_hstd_val,
imprv_hstd_val,
imprv_non_hstd_val,
num_personal as personal_prop_count,
personal_val,
num_mineral as mineral_prop_count,
mineral_val,
num_auto as auto_prop_count,
auto_val,

ag_market_ne as ag_market,
timber_market_ne as timber_market,
ag_use_ne as ag_use,
timber_use_ne as timber_use,

ag_market_ex as ag_market_ex,
timber_market_ex as timber_market_ex,
ag_use_ex as ag_use_ex,
timber_use_ex as timber_use_ex,

hs_count,
hs_local_amt,
hs_state_amt,
dv_count,
dv_amt,
dp_count,
dp_amt,
ex_count,
ex_amt,
ov65_count,
ov65_amt,
0 as ab_count,
ab_amt,
fr_count,
fr_amt,
pc_count,
pc_amt,
ex366_count,
ex366_amt,
ht_count,
ht_amt,
0 as so_count,
so_amt,
ch_count,
ch_amt,
lve_count,
lve_amt,
en_count,
en_amt,
land_hstd_val+land_non_hstd_val+imprv_hstd_val+imprv_non_hstd_val+personal_val+mineral_val+auto_val+ag_market_val+tim_market_val as market_val,
ag_market_ne+timber_market_ne-ag_use_ne-timber_use_ne as productivity_loss,
taxable_val,
hs_cap
from transfer_mt_appraisal_info_totals 
where dataset_id=@dataset_id
order by entity_id

-- Update the exemption amounts and counts from totals
select 
entity_id,
cast('DV' as varchar(20)) as exempt_type_cd,
sum(exempt_count) as cnt,
cast(sum(exempt_state_amt)+sum(exempt_local_amt) as numeric(20,3)) as amt,
cast(sum(exempt_state_amt) as numeric(20,3)) as state_amt,
cast(sum(exempt_local_amt) as numeric(20,3)) as local_amt
into #tmp2
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and exempt_type_cd like 'DV%' and arb_status in ('C', @inc_arb)
and prop_val_yr=@year
group by entity_id
order by entity_id

insert into #tmp2
select 
entity_id,
'OV65' as exempt_type_cd,
sum(exempt_count) as cnt,
sum(exempt_state_amt)+sum(exempt_local_amt) as amt,
sum(exempt_state_amt) as state_amt,
sum(exempt_local_amt) as local_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and exempt_type_cd like 'OV65%' and arb_status in ('C', @inc_arb)
and prop_val_yr=@year
group by entity_id
order by entity_id


insert into #tmp2
select 
entity_id,
exempt_type_cd,
sum(exempt_count) as cnt,
sum(exempt_state_amt)+sum(exempt_local_amt) as amt,
sum(exempt_state_amt) as state_amt,
sum(exempt_local_amt) as local_amt
from appraisal_totals_exemptions 
where pacs_user_id=@pacs_user and exempt_type_cd not like 'DV%' and exempt_type_cd not like 'OV65%' and arb_status in ('C', @inc_arb)
and prop_val_yr=@year
group by entity_id,exempt_type_cd
order by entity_id



update #tmp
set hs_count=#tmp2.cnt,
hs_local_amt=#tmp2.local_amt,
hs_state_amt=#tmp2.state_amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='HS'


update #tmp
set dv_count=#tmp2.cnt,
dv_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='DV'

update #tmp
set dp_count=#tmp2.cnt,
dp_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd='DP'

update #tmp
set ex_count=#tmp2.cnt,
ex_amt=ex_amt+#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and (exempt_type_cd = 'EX' )

update #tmp
set ex_count=#tmp2.cnt,
ex_amt=ex_amt+#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and (exempt_type_cd like 'EX (%')


update #tmp
set ov65_count=#tmp2.cnt,
ov65_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd like 'OV65'

update #tmp
set ab_count=#tmp2.cnt,
ab_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'AB'

update #tmp
set fr_count=#tmp2.cnt,
fr_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'FR'

update #tmp
set pc_count=#tmp2.cnt,
pc_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'PC'

update #tmp
set ex366_count=#tmp2.cnt,
ex366_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'EX366'

update #tmp
set ht_count=#tmp2.cnt,
ht_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'HT'

update #tmp
set so_count=#tmp2.cnt,
so_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'SO'

update #tmp
set ch_count=#tmp2.cnt,
ch_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'CH'

update #tmp
set lve_count=#tmp2.cnt,
lve_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'LVE'

update #tmp
set en_count=#tmp2.cnt,
en_amt=#tmp2.amt
from #tmp2
where #tmp.entity_id=#tmp2.entity_id and source='TOTALS' and exempt_type_cd = 'EN'

update #tmp
set taxable_val = 
market_val-hs_cap-productivity_loss-hs_local_amt-hs_state_amt-dv_amt-dp_amt-
ex_amt-ov65_amt-ab_amt-fr_amt-pc_amt-ex366_amt-ht_amt-so_amt-ch_amt-lve_amt-en_amt
where source = 'TOTALS'

-- Insert the difference records
insert into #tmp
select
'DIFF' as source, 
entity_id,
sum(case when source = 'TOTALS' then prop_count else - prop_count end) as prop_count,
sum(case when source = 'TOTALS' then land_hstd_val else - land_hstd_val end) as land_hstd_val,
sum(case when source = 'TOTALS' then land_non_hstd_val else - land_non_hstd_val end) as land_non_hstd_val,
sum(case when source = 'TOTALS' then imprv_hstd_val else - imprv_hstd_val end) as imprv_hstd_val,
sum(case when source = 'TOTALS' then imprv_non_hstd_val else - imprv_non_hstd_val end) as imprv_non_hstd_val,
sum(case when source = 'TOTALS' then personal_prop_count else - personal_prop_count end) as personal_prop_count,
sum(case when source = 'TOTALS' then personal_val else - personal_val end) as personal_val,
sum(case when source = 'TOTALS' then mineral_prop_count else - mineral_prop_count end) as mineral_prop_count,
sum(case when source = 'TOTALS' then mineral_val else - mineral_val end) as mineral_val,
sum(case when source = 'TOTALS' then auto_prop_count else - auto_prop_count end) as auto_prop_count,
sum(case when source = 'TOTALS' then auto_val else - auto_val end) as auto_val,

sum(case when source = 'TOTALS' then ag_market else - ag_market end) as ag_market,
sum(case when source = 'TOTALS' then timber_market else - timber_market end) as timber_market,

sum(case when source = 'TOTALS' then ag_use else - ag_use end) as ag_use,
sum(case when source = 'TOTALS' then timber_use else - timber_use end) as timber_use,

sum(case when source = 'TOTALS' then ag_market_ex else - ag_market_ex end) as ag_market_ex,
sum(case when source = 'TOTALS' then timber_market_ex else - timber_market_ex end) as timber_market_ex,

sum(case when source = 'TOTALS' then ag_use_ex else - ag_use_ex end) as ag_use_ex,
sum(case when source = 'TOTALS' then timber_use_ex else - timber_use_ex end) as timber_use_ex,

sum(case when source = 'TOTALS' then hs_count else - hs_count end) as hs_count,
sum(case when source = 'TOTALS' then hs_local_amt else - hs_local_amt end) as hs_local_amt,
sum(case when source = 'TOTALS' then hs_state_amt else - hs_state_amt end) as hs_state_amt,

sum(case when source = 'TOTALS' then dv_count else - dv_count end) as dv_count,
sum(case when source = 'TOTALS' then dv_amt else - dv_amt end) as dv_amt,
sum(case when source = 'TOTALS' then dp_count else - dp_count end) as dp_count,
sum(case when source = 'TOTALS' then dp_amt else - dp_amt end) as dp_amt,

sum(case when source = 'TOTALS' then ex_count else - ex_count end) as ex_count,
sum(case when source = 'TOTALS' then ex_amt else - ex_amt end) as ex_amt,
sum(case when source = 'TOTALS' then ov65_count else - ov65_count end) as ov65_count,
sum(case when source = 'TOTALS' then ov65_amt else - ov65_amt end) as ov65_amt,
sum(case when source = 'TOTALS' then ab_count else - ab_count end) as ab_count,
sum(case when source = 'TOTALS' then ab_amt else - ab_amt end) as ab_amt,
sum(case when source = 'TOTALS' then fr_count else - fr_count end) as fr_count,
sum(case when source = 'TOTALS' then fr_amt else - fr_amt end) as fr_amt,

sum(case when source = 'TOTALS' then pc_count else - pc_count end) as pc_count,
sum(case when source = 'TOTALS' then pc_amt else - pc_amt end) as pc_amt,

sum(case when source = 'TOTALS' then ex366_count else - ex366_count end) as ex366_count,
sum(case when source = 'TOTALS' then ex366_amt else - ex366_amt end) as ex366_amt,
sum(case when source = 'TOTALS' then ht_count else - ht_count end) as ht_count,
sum(case when source = 'TOTALS' then ht_amt else - ht_amt end) as ht_amt,
sum(case when source = 'TOTALS' then so_count else - so_count end) as so_count,
sum(case when source = 'TOTALS' then so_amt else - so_amt end) as so_amt,
sum(case when source = 'TOTALS' then ch_count else - ch_count end) as ch_count,
sum(case when source = 'TOTALS' then ch_amt else - ch_amt end) as ch_amt,

sum(case when source = 'TOTALS' then lve_count else - lve_count end) as lve_count,
sum(case when source = 'TOTALS' then lve_amt else - lve_amt end) as lve_amt,

sum(case when source = 'TOTALS' then en_count else - en_count end) as en_count,
sum(case when source = 'TOTALS' then en_amt else - en_amt end) as en_amt,

sum(case when source = 'TOTALS' then market_val else - market_val end) as market_val,
sum(case when source = 'TOTALS' then productivity_loss else - productivity_loss end) as productivity_loss,
sum(case when source = 'TOTALS' then taxable_val else - taxable_val end) as taxable_val,
sum(case when source = 'TOTALS' then hs_cap else - hs_cap end) as hs_cap
--market_val-productivity_loss-hs_local_amt-hs_state_amt-dv_amt-dp_amt-ex_amt-ov65_amt-ab_amt-fr_amt-pc_amt-ex366_amt-ht_amt-so_amt-ch_amt-lve_amt
--else - 
--(market_val-productivity_loss-hs_local_amt-hs_state_amt-dv_amt-dp_amt-ex_amt-ov65_amt-ab_amt-fr_amt-pc_amt-ex366_amt-ht_amt-so_amt-ch_amt-lve_amt)
--end) as taxable_val
from #tmp
group by entity_id
order by entity_id

-- Copy the records to permanent table
insert into AppraisalExportBalanceSheet
(
source,
entity_id,
prop_count,
land_hstd_val,
land_non_hstd_val,
imprv_hstd_val,
imprv_non_hstd_val,
personal_prop_count,
personal_val,
mineral_prop_count,
mineral_val,
auto_prop_count,
auto_val,
ag_market,
timber_market,
ag_use,
timber_use,

ag_market_ex,
timber_market_ex,
ag_use_ex,
timber_use_ex,

hs_count,
hs_local_amt,
hs_state_amt,
dv_count,
dv_amt,
dp_count,
dp_amt,
ex_count,
ex_amt,
ov65_count,
ov65_amt,
ab_count,
ab_amt,
fr_count,
fr_amt,
pc_count,
pc_amt,
ex366_count,
ex366_amt,
ht_count,
ht_amt,
so_count,
so_amt,
ch_count,
ch_amt,
lve_count,
lve_amt,
en_count,
en_amt,
market_val,
taxable_val,
productivity_loss,
hs_cap,
dataset_id
)
select
source,
entity_id,
prop_count,
land_hstd_val,
land_non_hstd_val,
imprv_hstd_val,
imprv_non_hstd_val,
personal_prop_count,
personal_val,
mineral_prop_count,
mineral_val,
auto_prop_count,
auto_val,
ag_market,
timber_market,
ag_use,
timber_use,

ag_market_ex,
timber_market_ex,
ag_use_ex,
timber_use_ex,

hs_count,
hs_local_amt,
hs_state_amt,
dv_count,
dv_amt,
dp_count,
dp_amt,
ex_count,
ex_amt,
ov65_count,
ov65_amt,
ab_count,
ab_amt,
fr_count,
fr_amt,
pc_count,
pc_amt,
ex366_count,
ex366_amt,
ht_count,
ht_amt,
so_count,
so_amt,
ch_count,
ch_amt,
lve_count,
lve_amt,
en_count,
en_amt,
market_val,
taxable_val,
productivity_loss,
hs_cap,
@dataset_id
from #tmp

drop table #tmp
drop table #tmp2

GO

