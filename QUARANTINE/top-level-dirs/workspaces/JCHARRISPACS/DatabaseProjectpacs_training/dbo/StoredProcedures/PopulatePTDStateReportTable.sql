
-- Appraisal totals must be run berfore this procedure, since the data is
-- retrieved from the appraisal totals tables
CREATE procedure [dbo].PopulatePTDStateReportTable
	@input_pacs_user int,
	@input_dataset_id bigint,
	@input_year as int,
	@input_sup_num as int,
	@input_tnt_export_id int = 0

as

set nocount on

declare @totals_query varchar(2000)
declare @input_pacs_user_x as int

declare @land_count int
declare @ls_code varchar(25)
declare @temp_acres_for_category numeric(18,4)
declare @temp_acres_for_production numeric(18,4)
declare @temp_productivity_value numeric(14,0)
declare @temp_market_value_land numeric(14,0)
declare @pct_acreage numeric(13,10)
declare @pct_ag_val numeric(13,10)
declare @pct_mkt_val numeric(13,10)
declare @prop_id int
declare @sup_num int
declare @total_acres_for_category numeric(18,4)
declare @total_productivity_value numeric(14, 0)
declare @total_market_value numeric(14, 0)
declare @ag_use_cd varchar(5)
declare @acres numeric(18,4)
declare @ag_use_val numeric(14,0)
declare @ag_market numeric(14,0)
declare @timber_use numeric(14,0)
declare @timber_market numeric(14,0)
declare @num_land_codes int
declare @state_land_type_desc varchar(10)
declare @prev_st_land_type_cd varchar(10)
declare @land_type_cd varchar(10)
declare @entity_id int
declare @state_cd varchar(10)
declare @num_land_records int


--set @input_pacs_user_x=(@input_pacs_user^70000000)

/*
 * Pacs user id's only go into the hundreds, so this should be safe.
 * If you change this, you will need to change PrintTotalsdlg.cpp::CallPacsReportsOCX() as well
 */

/*
declare @input_pacs_user int
declare @input_dataset_id bigint
declare @input_year as int
declare @input_sup_num as int
declare @input_tnt_export_id as int

set @input_pacs_user=2
set @input_dataset_id=100000
set @input_year=2005
set @input_sup_num=0
set @input_tnt_export_id as int
*/

set @input_pacs_user_x = @input_pacs_user + 100000


delete from ptd_mt_state_report where dataset_id=@input_dataset_id
delete from ptd_mt_state_report_tvb where dataset_id=@input_dataset_id
delete from ptd_mt_state_report_acreage_detail where dataset_id=@input_dataset_id
delete from ptd_mt_state_report_school_tax_limitation where dataset_id=@input_dataset_id
delete from ptd_mt_state_report_top_ten where dataset_id = @input_dataset_id

delete from ptd_mt_state_report_entity_tax_limitation where dataset_id = @input_dataset_id
delete from ptd_mt_state_report_acreage_timber where dataset_id = @input_dataset_id
delete from ptd_mt_state_report_acreage_wildlife where dataset_id = @input_dataset_id

if exists(select id from sysobjects where name = 'ptd_ag_timber_report')
begin
	delete from ptd_ag_timber_report where dataset_id = @input_dataset_id
end

create table #as_of
(
	prop_id int not null,
	sup_yr numeric(4,0) not null,
	sup_num int not null,
	primary key clustered (sup_yr, sup_num, prop_id) with fillfactor = 100
)

insert into #as_of (sup_yr, prop_id, sup_num)
select sup_yr,prop_id,max(sup_num) as sup_num 
from prop_owner_entity_val as poev with(nolock) 
where sup_yr = @input_year 
and poev.sup_num <= @input_sup_num
group by poev.sup_yr,prop_id 

delete #as_of
from property_val as pv with(nolock)
where #as_of.prop_id = pv.prop_id 
and #as_of.sup_num = pv.sup_num
and #as_of.sup_yr = pv.prop_val_yr
and (pv.prop_inactive_dt is not null
or isnull(pv.udi_parent,'') <> '')

--select * from ptd_mt_state_report
--select top 1 * from appraisal_totals

------------------------------------------------------------------------------
-- Populate PTD - Property Value Report Table
------------------------------------------------------------------------------
-- Insert values into the state report table, this table is used
-- for PTD property value reports

--
-- Build temp table for abatement info
--


select pee.entity_id, sum(case when 
				pe.sp_date_approved < '05/31/1993' and pe.sp_date_approved is not null
			then isnull(pee.state_amt,0) + isnull(pee.local_amt,0)
			else 0
			end) as total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993,
		sum(case when 
				(pe.sp_date_approved >= '05/31/1993' or pe.sp_date_approved is null)
			then isnull(pee.state_amt,0) + isnull(pee.local_amt,0)
			else 0
			end) total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993
into #tmp_abatement_info
FROM property_entity_exemption as pee
with (nolock)
INNER JOIN property_exemption as pe 
with (nolock)
ON	pee.prop_id = pe.prop_id AND 
	pee.owner_id = pe.owner_id AND 
	pee.exmpt_tax_yr = pe.exmpt_tax_yr AND 
	pee.owner_tax_yr = pe.owner_tax_yr AND 
	pee.exmpt_type_cd = pe.exmpt_type_cd AND 
	pee.sup_num = pe.sup_num
inner join #as_of asof
	on pee.prop_id = asof.prop_id
	and pee.exmpt_tax_yr = asof.sup_yr
	and pee.sup_num = asof.sup_num
INNER JOIN entity as e 
with (nolock)
ON	pee.entity_id = e.entity_id
inner join appraisal_totals_criteria_entity as el 
with (nolock) 
on pee.entity_id = el.entity_id
and el.pacs_user_id = @input_pacs_user
LEFT OUTER JOIN entity_exmpt as ee 
with (nolock)
ON	pee.owner_tax_yr = ee.exmpt_tax_yr AND 
	pee.entity_id = ee.entity_id AND 
	pee.exmpt_type_cd = ee.exmpt_type_cd

where pee.exmpt_tax_yr = @input_year
and pee.exmpt_type_cd = 'AB'
and e.entity_type_cd = 'S'
and (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0

group by pee.entity_id


insert into ptd_mt_state_report
(
year,
as_of_sup_num,
entity_id,
date,

market_val,
exempt_val,

hs_state_loss_count,
hs_state_loss_amt,

fmfc_hs_state_loss_count,
fmfc_hs_state_loss_amt,

ov65_state_loss_count,
dp_state_loss_count,
ov65_dp_state_loss_amt,

ov65_local_option_loss_count,
dp_local_option_loss_count,
ov65_dp_local_option_loss_amt,

fmfc_ov65_local_option_loss_count,
fmfc_dp_local_option_loss_count,
fmfc_ov65_dp_local_option_loss_amt,

hs_local_option_loss_pct,
hs_local_option_loss_count,
hs_local_option_loss_amt,

dv_loss_count,
dv_loss_amt,

fmfc_dv_loss_count,
fmfc_dv_loss_amt,

freeport_loss_count,
freeport_loss_amt,

pollutioncontrol_loss_count,
pollutioncontrol_loss_amt,

productivity_acres,
productivity_value_loss,

abatement_loss_count,
abatement_loss,

other_loss_count,
other_loss,

historical_loss_count,
historical_loss,

hs_cap_loss,

m_n_o_tax_rate,
i_n_s_tax_rate,

fmfc_m_n_o_tax_rate,
fmfc_i_n_s_tax_rate, 
fmfc_tax_rate,

hs_cap_appraised_val,
hs_cap_assessed_val,

abatement_appraised_before_may311993,
abatement_taxable_before_may311993,
abatement_appraised_after_may311993,
abatement_taxable_after_may311993,

certified_market_value,
uncertified_market_value,

industrial_exemptions,

general_fund_m_n_o_tax_rate,
general_fund_i_n_s_tax_rate,
general_fund_tax_rate,
road_bridge_m_n_o_tax_rate,
road_bridge_i_n_s_tax_rate,
road_bridge_tax_rate,

total_appraised_value_with_abatements,
total_taxable_value_with_abatements,

taxes_paid_into_tif,
payments_into_tif,
taxincrement_loss,
taxincrement_loss_count,

dataset_id,

eco_loss_amt,
eco_loss_count,

chodo_lowpop_loss_amt,
chodo_lowpop_loss_count,
chodo_highpop_loss_amt,
chodo_highpop_loss_count,

hs_before_exemptions,
school_freeze_loss
)

select 
@input_year,
@input_sup_num,
t.entity_id,
GetDate(),

land_hstd_val+land_non_hstd_val+
imprv_hstd_val+imprv_non_hstd_val+
personal_val+mineral_val+auto_val+
ag_market+timber_market+ 
ag_market_ex+timber_market_ex 
as market_val,

-- Exemption queries, flatten the table through use of correlated sub-queries
-- EX and EX366 state and local amount
(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0))
	from appraisal_totals_exemptions as ee with(nolock) 
	where exempt_type_cd in ('EX','EX366')
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as exempt_val,

-- HS state amount
(	select sum(isnull(exempt_count,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HS'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as hs_state_loss_count,

(	select sum(isnull(exempt_state_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HS'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as hs_state_loss_amt,


(	select sum(isnull(exempt_count,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HS'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as fmfc_hs_state_loss_count,

(	select sum(isnull(exempt_state_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HS'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as fmfc_hs_state_loss_amt,

-- OV65 and DP state amount
(	select sum(isnull(exempt_count,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd like 'OV65%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as ov65_state_loss_count,

(	select sum(isnull(exempt_count,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'DP'
	and ee.arb_status='0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as dp_state_loss_count,

(	select sum(isnull(exempt_state_amt,0)) 
	from appraisal_totals_exemptions as ee with(nolock) 
	where (exempt_type_cd = 'DP' or exempt_type_cd like 'OV65%')
	and ee.arb_status='0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.entity_id = t.entity_id
	and ee.tnt_export_id = @input_tnt_export_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as ov65_dp_state_loss_amt,

-- OV65 or DP local amount
(	select sum(exempt_count) 
	from appraisal_totals_exemptions as ee with (nolock) 
	inner join entity_exmpt as ene with (nolock)
	on ene.entity_id = ee.entity_id
	and ene.exmpt_type_cd = ee.exempt_type_cd
	and ene.exmpt_tax_yr = ee.prop_val_yr
	where exempt_type_cd like 'OV65%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
	and (isnull(ene.local_option_pct,0) > 0 or isnull(ene.local_option_amt,0) > 0)
) as ov65_local_option_loss_count,

(	select sum(exempt_count) 
	from appraisal_totals_exemptions as ee with (nolock) 
	inner join entity_exmpt as ene with (nolock)
	on ene.entity_id = ee.entity_id
	and ene.exmpt_type_cd = ee.exempt_type_cd
	and ene.exmpt_tax_yr = @input_year
	where exempt_type_cd = 'DP'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.entity_id = t.entity_id
	and ee.tnt_export_id = @input_tnt_export_id
	and (isnull(ene.local_option_pct,0) > 0 or isnull(ene.local_option_amt,0) > 0)
	and isnull(ptd_multi_unit,'') <> 'B'
) as dp_local_option_loss_count,

(	select sum(isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where (exempt_type_cd = 'DP' or exempt_type_cd like 'OV65%')
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.entity_id = t.entity_id
	and ee.tnt_export_id = @input_tnt_export_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as ov65_dp_local_option_loss_amt,

(	select sum(exempt_count) 
	from appraisal_totals_exemptions as ee with (nolock) 
	inner join entity_exmpt as ene with (nolock)
	on ene.entity_id = ee.entity_id
	and ene.exmpt_type_cd = ee.exempt_type_cd
	and ene.exmpt_tax_yr = @input_year
	where exempt_type_cd like 'OV65%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and (isnull(ene.local_option_pct,0) > 0 or isnull(ene.local_option_amt,0) > 0)
	and isnull(ptd_multi_unit,'') = 'B'
) as fmfc_ov65_local_option_loss_count,

(	select sum(exempt_count) 
	from appraisal_totals_exemptions as ee with (nolock) 
	inner join entity_exmpt as ene with (nolock)
	on ene.entity_id = ee.entity_id
	and ene.exmpt_type_cd = ee.exempt_type_cd
	and ene.exmpt_tax_yr = @input_year
	where exempt_type_cd = 'DP'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and (isnull(ene.local_option_pct,0) > 0 or isnull(ene.local_option_amt,0) > 0)
	and isnull(ptd_multi_unit,'') = 'B'
) as fmfc_dp_local_option_loss_count,

(	select sum(isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where (exempt_type_cd = 'DP' or exempt_type_cd like 'OV65%')
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.entity_id = t.entity_id
	and ee.tnt_export_id = @input_tnt_export_id
	and isnull(ptd_multi_unit,'') = 'B'
) as fmfc_ov65_dp_local_option_loss_amt,

-- HS local amount
(	select local_option_pct 
	from entity_exmpt as ene with (nolock)
	where ene.exmpt_type_cd = 'HS'
	and ene.entity_id = t.entity_id
	and ene.exmpt_tax_yr = @input_year
) as hs_local_option_loss_pct,

(	select sum(ee.exempt_count) 
	from appraisal_totals_exemptions as ee with(nolock)
	inner join entity_exmpt as ene with(nolock)
	on ene.entity_id = ee.entity_id
	and ene.exmpt_type_cd = ee.exempt_type_cd
	and ene.exmpt_tax_yr = @input_year
	where exmpt_type_cd = 'HS'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and (isnull(ene.local_option_pct,0) > 0 or isnull(ene.local_option_amt,0) > 0)
) as hs_local_option_loss_count,

(	select sum(isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HS'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as hs_local_option_loss_amt,

-- DV state and local amount
(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd like 'DV%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as dv_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd like 'DV%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') <> 'B'
) as dv_loss_amt,

(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd like 'DV%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') = 'B'
) as fmfc_dv_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd like 'DV%'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
	and isnull(ptd_multi_unit,'') = 'B'
) as fmfc_dv_loss_amt,

-- FR state and local amount
(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'FR'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as freeport_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'FR'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as freeport_loss_amt,

-- PC state and local amount
(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'PC'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as pollutioncontrol_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'PC'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id=t.entity_id
) as pollutioncontrol_loss_amt,

-- Productivity acres and loss
(	select sum(acres) from appraisal_totals_state_cd with (nolock)
	where entity_id = t.entity_id
	and pacs_user_id = @input_pacs_user
	and prop_val_yr = @input_year
	and tnt_export_id = @input_tnt_export_id 
	and state_cd = 'D1'
	and arb_status = '0'
) as productivity_acres,

productivity_loss as productivity_value_loss,

-- AB state and local amount
(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'AB'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as abatement_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with(nolock) 
	where exempt_type_cd = 'AB'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as abatement_loss,

-- other loss: SO (solar), CH (charitable),
-- EN (energy), and prorated
(
	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with(nolock) 
	where exempt_type_cd in ('SO','CH','EN','EX (Prorated)')
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as other_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd in ('SO','CH','EN','EX (Prorated)')
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as other_loss,

-- HT state and local amount and prorated EX exemptions
(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HT'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as historical_loss_count,

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'HT'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as historical_loss,

ten_percent_cap as hs_cap_loss,

-- Tax rates
case when isnull(ptd_multi_unit,'') <> 'B' then isnull(m_n_o_tax_pct,0) else 0 end as m_n_o_tax_rate,
case when isnull(ptd_multi_unit,'') <> 'B' then isnull(i_n_s_tax_pct,0) else 0 end as i_n_s_tax_rate,

case when isnull(ptd_multi_unit,'') = 'B' then isnull(m_n_o_tax_pct,0) else 0 end as fmfc_m_n_o_tax_rate,
case when isnull(ptd_multi_unit,'') = 'B' then isnull(i_n_s_tax_pct,0) else 0 end as fmfc_i_n_s_tax_rate,
case when isnull(ptd_multi_unit,'') = 'B' then isnull(m_n_o_tax_pct,0) + isnull(i_n_s_tax_pct,0) else 0 end as fmfc_tax_rate, 


(
	select sum(poev.land_hstd_val + poev.imprv_hstd_val)
	from prop_owner_entity_val as poev with (nolock)

	inner join #as_of asof
	on poev.prop_id = asof.prop_id
	and poev.sup_yr = asof.sup_yr
	and poev.sup_num = asof.sup_num

	join property_val as pv with (nolock)
	on poev.prop_id = pv.prop_id
	and poev.sup_yr = pv.prop_val_yr
	and poev.sup_num = pv.sup_num
	and pv.prop_inactive_dt is null

	where poev.sup_yr = @input_year
	and poev.entity_id = t.entity_id
	and isnull(poev.ten_percent_cap, 0) > 0
) as hs_cap_appraised_val,

(
	select sum(
	  case when (poev.land_hstd_val + poev.imprv_hstd_val - poev.ten_percent_cap) > 0 then
                    (poev.land_hstd_val + poev.imprv_hstd_val - poev.ten_percent_cap)
	             else 0 end
	)
	from prop_owner_entity_val as poev with (nolock)

	inner join #as_of asof
	on poev.prop_id = asof.prop_id
	and poev.sup_yr = asof.sup_yr
	and poev.sup_num = asof.sup_num

	join property_val as pv with (nolock)
	on poev.prop_id = pv.prop_id
	and poev.sup_yr = pv.prop_val_yr
	and poev.sup_num = pv.sup_num
	and pv.prop_inactive_dt is null

	where poev.sup_yr = @input_year
	and poev.entity_id = t.entity_id
	and isnull(poev.ten_percent_cap, 0) > 0
) as hs_cap_assessed_val,


-- abatements section

(
	select sum(isnull(poev.appraised_val,0))
	FROM dbo.prop_owner_entity_val as poev
	with (nolock)
	INNER JOIN dbo.property_entity_exemption as pee 
	with (nolock)
	ON	pee.prop_id = poev.prop_id AND 
		pee.owner_id = poev.owner_id AND 
		pee.exmpt_tax_yr = poev.sup_yr AND 
		pee.owner_tax_yr = poev.sup_yr AND
		pee.sup_num = poev.sup_num AND
		pee.entity_id = poev.entity_id
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	inner join dbo.property_val pv 
	with (nolock)
		on pv.prop_id = pee.prop_id 
		and pv.prop_val_yr = pee.exmpt_tax_yr
		and pv.sup_num = pee.sup_num 
		and pv.prop_inactive_dt is null
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	INNER JOIN property_exemption as pe 
	with (nolock)
	ON	pee.prop_id = pe.prop_id AND 
		pee.owner_id = pe.owner_id AND 
		pee.exmpt_tax_yr = pe.exmpt_tax_yr AND 
		pee.owner_tax_yr = pe.owner_tax_yr AND 
		pee.exmpt_type_cd = pe.exmpt_type_cd AND 
		pee.sup_num = pe.sup_num
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and pee.exmpt_type_cd = 'AB'
	and entity_type_cd = 'S'
	and (pe.sp_date_approved < '05/31/1993' and pe.sp_date_approved is not null)
	and (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0
) as abatement_appraised_before_may311993,


(
	select sum(isnull(poev.taxable_val,0))
	FROM dbo.prop_owner_entity_val as poev
	with (nolock)
	INNER JOIN dbo.property_entity_exemption as pee 
	with (nolock)
	ON	pee.prop_id = poev.prop_id AND 
		pee.owner_id = poev.owner_id AND 
		pee.exmpt_tax_yr = poev.sup_yr AND 
		pee.owner_tax_yr = poev.sup_yr AND
		pee.sup_num = poev.sup_num AND
		pee.entity_id = poev.entity_id
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	inner join dbo.property_val pv 
	with (nolock)
		on pv.prop_id = pee.prop_id 
		and pv.prop_val_yr = pee.exmpt_tax_yr
		and pv.sup_num = pee.sup_num 
		and pv.prop_inactive_dt is null
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	INNER JOIN property_exemption as pe 
	with (nolock)
	ON	pee.prop_id = pe.prop_id AND 
		pee.owner_id = pe.owner_id AND 
		pee.exmpt_tax_yr = pe.exmpt_tax_yr AND 
		pee.owner_tax_yr = pe.owner_tax_yr AND 
		pee.exmpt_type_cd = pe.exmpt_type_cd AND 
		pee.sup_num = pe.sup_num
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and pee.exmpt_type_cd = 'AB'
	and entity_type_cd = 'S'
	and (pe.sp_date_approved < '05/31/1993' and pe.sp_date_approved is not null)
	and  (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0
) as abatement_taxable_before_may311993,


(
	select sum(isnull(poev.appraised_val,0))
	FROM dbo.prop_owner_entity_val as poev
	with (nolock)
	INNER JOIN dbo.property_entity_exemption as pee 
	with (nolock)
	ON	pee.prop_id = poev.prop_id AND 
		pee.owner_id = poev.owner_id AND 
		pee.exmpt_tax_yr = poev.sup_yr AND 
		pee.owner_tax_yr = poev.sup_yr AND
		pee.sup_num = poev.sup_num AND
		pee.entity_id = poev.entity_id
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	inner join dbo.property_val pv 
	with (nolock)
		on pv.prop_id = pee.prop_id 
		and pv.prop_val_yr = pee.exmpt_tax_yr
		and pv.sup_num = pee.sup_num 
		and pv.prop_inactive_dt is null
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	INNER JOIN property_exemption as pe 
	with (nolock)
	ON	pee.prop_id = pe.prop_id AND 
		pee.owner_id = pe.owner_id AND 
		pee.exmpt_tax_yr = pe.exmpt_tax_yr AND 
		pee.owner_tax_yr = pe.owner_tax_yr AND 
		pee.exmpt_type_cd = pe.exmpt_type_cd AND 
		pee.sup_num = pe.sup_num
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and pee.exmpt_type_cd = 'AB'
	and entity_type_cd = 'S'
	and (pe.sp_date_approved >= '05/31/1993' or pe.sp_date_approved is null)
	and (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0
) as abatement_appraised_after_may311993,


(
	select sum(isnull(poev.taxable_val,0))
	FROM dbo.prop_owner_entity_val as poev
	with (nolock)
	INNER JOIN dbo.property_entity_exemption as pee 
	with (nolock)
	ON	pee.prop_id = poev.prop_id AND 
		pee.owner_id = poev.owner_id AND 
		pee.exmpt_tax_yr = poev.sup_yr AND 
		pee.owner_tax_yr = poev.sup_yr AND
		pee.sup_num = poev.sup_num AND
		pee.entity_id = poev.entity_id
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	inner join dbo.property_val pv 
	with (nolock)
		on pv.prop_id = pee.prop_id 
		and pv.prop_val_yr = pee.exmpt_tax_yr
		and pv.sup_num = pee.sup_num 
		and pv.prop_inactive_dt is null
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	INNER JOIN property_exemption as pe 
	with (nolock)
	ON	pee.prop_id = pe.prop_id AND 
		pee.owner_id = pe.owner_id AND 
		pee.exmpt_tax_yr = pe.exmpt_tax_yr AND 
		pee.owner_tax_yr = pe.owner_tax_yr AND 
		pee.exmpt_type_cd = pe.exmpt_type_cd AND 
		pee.sup_num = pe.sup_num
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and pee.exmpt_type_cd = 'AB'
	and entity_type_cd = 'S'
	and (pe.sp_date_approved >= '05/31/1993' or pe.sp_date_approved is null)
	and  (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0
) as abatement_taxable_after_may311993,


(
	select isnull(sum(market),0) from appraisal_totals_state_cd as atsc with (nolock) 
	where atsc.entity_id = t.entity_id 
	and atsc.prop_val_yr = t.prop_val_yr
	and atsc.pacs_user_id = t.pacs_user_id 
	and atsc.tnt_export_id = t.tnt_export_id 
	and atsc.state_cd <> 'X'
	and (atsc.arb_status = 'C')
)
as certified_market_value,

(
	select isnull(sum(market),0) from appraisal_totals_state_cd as atsc with (nolock) 
	where atsc.entity_id = t.entity_id 
	and atsc.prop_val_yr = t.prop_val_yr
	and atsc.pacs_user_id = t.pacs_user_id 
	and atsc.tnt_export_id = t.tnt_export_id
	and atsc.state_cd <> 'X'
	and (atsc.arb_status = 'A')
)
as uncertified_market_value,

(
	select sum(isnull(state_amt,0) + isnull(local_amt,0))
	FROM dbo.property_entity_exemption as pee
	with (nolock)
	INNER JOIN dbo.property_exemption as pe 
	with (nolock)
	ON	pee.prop_id = pe.prop_id AND 
		pee.owner_id = pe.owner_id AND 
		pee.exmpt_tax_yr = pe.exmpt_tax_yr AND 
		pee.owner_tax_yr = pe.owner_tax_yr AND 
		pee.exmpt_type_cd = pe.exmpt_type_cd AND 
		pee.sup_num = pe.sup_num
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	LEFT OUTER JOIN dbo.entity_exmpt as ee 
	with (nolock)
	ON	pee.owner_tax_yr = ee.exmpt_tax_yr AND 
		pee.entity_id = ee.entity_id AND 
		pee.exmpt_type_cd = ee.exmpt_type_cd
	
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and left(pee.exmpt_type_cd,2) <> 'EX'
	and pee.prop_id in
	(
		select prop_id
		from property_owner_entity_state_cd as poes
		with (nolock)
		where state_cd in ('F2','L2')
		and prop_id = pee.prop_id
		and [year] = pee.exmpt_tax_yr
		and sup_num = pee.sup_num
		and owner_id = pee.owner_id
		and entity_id = pee.entity_id
	)

) as industrial_exemptions,

case when isnull(ptd_multi_unit,'') = 'A' then isnull(m_n_o_tax_pct,0) else 0 end as general_fund_m_n_o_tax_rate,
case when isnull(ptd_multi_unit,'') = 'A' then isnull(i_n_s_tax_pct,0) else 0 end as general_fund_i_n_s_tax_rate,
case when isnull(ptd_multi_unit,'') = 'A' then isnull(m_n_o_tax_pct,0)+ isnull(i_n_s_tax_pct,0) else 0 end as general_fund_tax_rate,

case when isnull(ptd_multi_unit,'') = 'C' then isnull(m_n_o_tax_pct,0) else 0 end as road_bridge_m_n_o_tax_rate,
case when isnull(ptd_multi_unit,'') = 'C' then isnull(i_n_s_tax_pct,0) else 0 end as road_bridge_i_n_s_tax_rate,
case when isnull(ptd_multi_unit,'') = 'C' then isnull(m_n_o_tax_pct,0)+ isnull(i_n_s_tax_pct,0) else 0 end as road_bridge_tax_rate,

(
	select sum(isnull(poev.appraised_val,0))
	FROM dbo.prop_owner_entity_val as poev
	with (nolock)
	INNER JOIN dbo.property_entity_exemption as pee 
	with (nolock)
	ON	pee.prop_id = poev.prop_id AND 
		pee.owner_id = poev.owner_id AND 
		pee.exmpt_tax_yr = poev.sup_yr AND 
		pee.owner_tax_yr = poev.sup_yr AND
		pee.sup_num = poev.sup_num AND
		pee.entity_id = poev.entity_id
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	inner join dbo.property_val pv 
	with (nolock)
		on pv.prop_id = pee.prop_id 
		and pv.prop_val_yr = pee.exmpt_tax_yr
		and pv.sup_num = pee.sup_num 
		and pv.prop_inactive_dt is null
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and pee.exmpt_type_cd = 'AB'
	and entity_type_cd <> 'S'
	and  (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0
) as total_appraised_value_with_abatements,


(
	select sum(isnull(poev.taxable_val,0))
	FROM dbo.prop_owner_entity_val as poev
	with (nolock)
	INNER JOIN dbo.property_entity_exemption as pee 
	with (nolock)
	ON	pee.prop_id = poev.prop_id AND 
		pee.owner_id = poev.owner_id AND 
		pee.exmpt_tax_yr = poev.sup_yr AND 
		pee.owner_tax_yr = poev.sup_yr AND
		pee.sup_num = poev.sup_num AND
		pee.entity_id = poev.entity_id
	inner join #as_of asof
		on pee.prop_id = asof.prop_id
		and pee.exmpt_tax_yr = asof.sup_yr
		and pee.sup_num = asof.sup_num
	inner join dbo.property_val pv 
	with (nolock)
		on pv.prop_id = pee.prop_id 
		and pv.prop_val_yr = pee.exmpt_tax_yr
		and pv.sup_num = pee.sup_num 
		and pv.prop_inactive_dt is null
	INNER JOIN dbo.entity as e 
	with (nolock)
	ON	pee.entity_id = e.entity_id
	where pee.exmpt_tax_yr = @input_year
	and pee.entity_id = t.entity_id
	and pee.exmpt_type_cd = 'AB'
	and entity_type_cd <> 'S'
	and  (isnull(pee.state_amt,0) + isnull(pee.local_amt,0)) > 0
) as total_taxable_value_with_abatements,


-- TIF fields

(isnull(t.tax_increment_loss,0) * isnull(t.tax_rate,0) / 100) as taxes_paid_into_tif,
isnull(t.tax_increment_loss,0) as payments_into_tif,
isnull(t.tax_increment_loss,0) as taxincrement_loss,

(select count(poev.prop_id) from prop_owner_entity_val poev with (nolock)

 inner join #as_of asof with (nolock)
 on poev.prop_id = asof.prop_id 
 and poev.sup_yr = asof.sup_yr
 and poev.sup_num = asof.sup_num

 inner join property_val as pv with (nolock)
 on poev.prop_id = pv.prop_id
 and poev.sup_yr = pv.prop_val_yr
 and poev.sup_num = pv.sup_num
 and pv.prop_inactive_dt is null

 where poev.entity_id = t.entity_id
 and poev.sup_yr = @input_year
 and pv.tif_flag = 'T'

) as taxincrement_loss_count,


-- dataset ID

@input_dataset_id,

-- ECO exemption loss amount and count
(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'ECO'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as eco_loss_amt,

(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'ECO'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as eco_loss_count,

-- CHODO exemptions

(	select sum(isnull(exempt_state_amt,0) + isnull(exempt_local_amt,0)) 
	from appraisal_totals_exemptions as ee with (nolock) 
	where exempt_type_cd = 'CHODO'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as chodo_lowpop_loss_amt,

(	select sum(exempt_count)
	from appraisal_totals_exemptions as ee with(nolock) 
	where exempt_type_cd = 'CHODO'
	and ee.arb_status = '0'
	and ee.pacs_user_id = @input_pacs_user
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id = t.entity_id
) as chodo_lowpop_loss_count,

0, -- chodo_highpop_loss_amt
0, -- chodo_highpop_loss_count

-- all market HS before exemptions
(
	select sum(poev.land_hstd_val + poev.imprv_hstd_val)
	from prop_owner_entity_val as poev with (nolock)

	inner join #as_of asof
	on poev.prop_id = asof.prop_id
	and poev.sup_yr = asof.sup_yr
	and poev.sup_num = asof.sup_num

	join property_val as pv with (nolock)
	on poev.prop_id = pv.prop_id
	and poev.sup_yr = pv.prop_val_yr
	and poev.sup_num = pv.sup_num
	and pv.prop_inactive_dt is null

	inner join property_entity_exemption pee with (nolock)
	on pee.prop_id = asof.prop_id
	and pee.exmpt_tax_yr = asof.sup_yr
	and pee.sup_num = asof.sup_num
	and pee.entity_id = t.entity_id
	and exmpt_type_cd = 'HS'

	where poev.sup_yr = @input_year
	and poev.entity_id = t.entity_id
) as hs_before_exemptions,

0 -- school_freeze_loss


from appraisal_totals as t with (nolock)

inner join appraisal_totals_criteria_entity as el with (nolock)
on el.entity_id = t.entity_id
and el.pacs_user_id = t.pacs_user_id
and el.tnt_export_id = t.tnt_export_id

inner join entity as ent with (nolock)
on el.entity_id = ent.entity_id

left outer join tax_rate as tr with (nolock)
on tr.entity_id = el.entity_id
and tr.tax_rate_yr = @input_year

left outer join #tmp_abatement_info as ab with (nolock)
on t.entity_id = ab.entity_id

where arb_status = '0'
and t.pacs_user_id = @input_pacs_user
and t.tnt_export_id = @input_tnt_export_id
order by t.entity_id

------------
-- fix nulls

update ptd_mt_state_report set

market_val = isnull(market_val,0),
exempt_val = isnull(exempt_val,0),

hs_state_loss_count = isnull(hs_state_loss_count,0),
hs_state_loss_amt = isnull(hs_state_loss_amt,0),

fmfc_hs_state_loss_count = isnull(fmfc_hs_state_loss_count,0),
fmfc_hs_state_loss_amt = isnull(fmfc_hs_state_loss_amt,0),

ov65_state_loss_count = isnull(ov65_state_loss_count,0),
dp_state_loss_count = isnull(dp_state_loss_count,0),
ov65_dp_state_loss_amt = isnull(ov65_dp_state_loss_amt,0),

ov65_local_option_loss_count = isnull(ov65_local_option_loss_count,0),
dp_local_option_loss_count = isnull(dp_local_option_loss_count,0),
ov65_dp_local_option_loss_amt = isnull(ov65_dp_local_option_loss_amt,0),

fmfc_ov65_local_option_loss_count = isnull(fmfc_ov65_local_option_loss_count,0),
fmfc_dp_local_option_loss_count = isnull(fmfc_dp_local_option_loss_count,0),
fmfc_ov65_dp_local_option_loss_amt = isnull(fmfc_ov65_dp_local_option_loss_amt,0),

hs_local_option_loss_pct = isnull(hs_local_option_loss_pct,0),
hs_local_option_loss_count = isnull(hs_local_option_loss_count,0),
hs_local_option_loss_amt = isnull(hs_local_option_loss_amt,0),

dv_loss_count = isnull(dv_loss_count,0),
dv_loss_amt = isnull(dv_loss_amt,0),

fmfc_dv_loss_count = isnull(fmfc_dv_loss_count,0),
fmfc_dv_loss_amt = isnull(fmfc_dv_loss_amt,0),

freeport_loss_count = isnull(freeport_loss_count,0),
freeport_loss_amt = isnull(freeport_loss_amt,0),

pollutioncontrol_loss_count = isnull(pollutioncontrol_loss_count,0),
pollutioncontrol_loss_amt = isnull(pollutioncontrol_loss_amt,0),

productivity_acres = isnull(productivity_acres,0),
productivity_value_loss = isnull(productivity_value_loss,0),

abatement_loss_count = isnull(abatement_loss_count,0),
abatement_loss = isnull(abatement_loss,0),

other_loss_count = isnull(other_loss_count,0),
other_loss = isnull(other_loss,0),

historical_loss_count = isnull(historical_loss_count,0),
historical_loss = isnull(historical_loss,0),

hs_cap_loss = isnull(hs_cap_loss,0),

abatement_appraised_before_may311993 = isnull(abatement_appraised_before_may311993,0),
abatement_taxable_before_may311993 = isnull(abatement_taxable_before_may311993,0),
abatement_appraised_after_may311993 = isnull(abatement_appraised_after_may311993,0),
abatement_taxable_after_may311993 = isnull(abatement_taxable_after_may311993,0),

certified_market_value = isnull(certified_market_value,0),
uncertified_market_value = isnull(uncertified_market_value,0),

industrial_exemptions = isnull(industrial_exemptions,0),

total_appraised_value_with_abatements = isnull(total_appraised_value_with_abatements,0),
total_taxable_value_with_abatements = isnull(total_taxable_value_with_abatements,0),

taxes_paid_into_tif = isnull(taxes_paid_into_tif,0),
payments_into_tif = isnull(payments_into_tif,0),
taxincrement_loss = isnull(taxincrement_loss,0),
taxincrement_loss_count = isnull(taxincrement_loss_count,0),

eco_loss_amt = isnull(eco_loss_amt,0),
eco_loss_count = isnull(eco_loss_count,0),

chodo_lowpop_loss_amt = isnull(chodo_lowpop_loss_amt,0),
chodo_lowpop_loss_count = isnull(chodo_lowpop_loss_count,0),
chodo_highpop_loss_amt = isnull(chodo_highpop_loss_amt,0),
chodo_highpop_loss_count = isnull(chodo_highpop_loss_count,0),

hs_before_exemptions = isnull(hs_before_exemptions,0)

from ptd_mt_state_report
where dataset_id = @input_dataset_id

-------------------------------------------------------------------------------------
-- Set calculated values

update ptd_mt_state_report
set taxable_val =
  market_val
- exempt_val
- hs_state_loss_amt
- ov65_dp_state_loss_amt
- ov65_dp_local_option_loss_amt
- hs_local_option_loss_amt
- dv_loss_amt
- freeport_loss_amt
- pollutioncontrol_loss_amt
- 0  -- waterconservation_loss
- productivity_value_loss
- abatement_loss
- eco_loss_amt
- other_loss
- historical_loss
- hs_cap_loss
- chodo_lowpop_loss_amt
- chodo_highpop_loss_amt,

total_tax_rate =
m_n_o_tax_rate
+i_n_s_tax_rate
+fmfc_m_n_o_tax_rate
+fmfc_i_n_s_tax_rate

from ptd_mt_state_report
where dataset_id = @input_dataset_id


update ptd_mt_state_report
set levy_lost_to_abatements =
isnull(abatement_loss * total_tax_rate * 0.01, 0)
from ptd_mt_state_report
where dataset_id = @input_dataset_id


------------------------------------------------------------------------------
-- Populate PTD - State Code Breakdown for Property Value Reports
------------------------------------------------------------------------------
-- Insert the data into ptd_mt_state_report_tvb

--
-- Determine property count for D* state codes
--

select entity_id, sum(prop_ct) as prop_count
into #tmp_d_prop_count
from appraisal_totals_state_cd with (nolock)
where left(state_cd, 1) = 'D'
and arb_status = '0'
and pacs_user_id = @input_pacs_user
and tnt_export_id = @input_tnt_export_id
group by entity_id

insert into ptd_mt_state_report_tvb
(
entity_id,
year,
as_of_sup_num,
date,
category_cd,
category_count,
category_acres,
category_amt,
dataset_id,
category_d_count
)

select 
el.entity_id,
@input_year,
@input_sup_num,
GetDate(),
state_cd,
prop_ct,
acres,
case when state_cd = 'X' then 0 else market end as category_amt,
@input_dataset_id,
t.prop_count

from appraisal_totals_state_cd as ascd with (nolock)

join appraisal_totals_criteria_entity as el with (nolock) 
on el.entity_id = ascd.entity_id 
and el.pacs_user_id = ascd.pacs_user_id
and el.tnt_export_id = ascd.tnt_export_id

left outer join #tmp_d_prop_count as t with (nolock)
on ascd.entity_id = t.entity_id

where arb_status = '0'
and ascd.pacs_user_id = @input_pacs_user
and ascd.tnt_export_id = @input_tnt_export_id

------------------------------------------------------------------------------
-- do acreage breakdown
------------------------------------------------------------------------------
--RK/JI 02/2006 Must use parents info when dealing with child properties
select prop_id, sup_yr, sup_num, prop_id as child_id  into #as_of_temp_ag from #as_of

update #as_of_temp_ag
set prop_id = udi_parent_prop_id
from #as_of_temp_ag
inner join property_val as pv with (nolock) on
	#as_of_temp_ag.prop_id = pv.prop_id
and	#as_of_temp_ag.sup_yr = pv.prop_val_yr
and	#as_of_temp_ag.sup_num = pv.sup_num
where	udi_parent_prop_id is not null 
and		IsNull(pv.udi_parent,'')=''

create nonclustered index IDX_tmp_as_of_two_prop_id_sup_yr_sup_num
on #as_of_temp_ag (prop_id, child_id, sup_yr, sup_num)
with fillfactor = 90


create table #tmp_ptd_land_detail
(
	prop_id int not null,
	sup_num int not null,
	prop_val_yr numeric(4,0) not null,
	state_cd varchar(10) null,
	ag_use_cd varchar(5) not null,
	land_type_cd varchar(10) null,
	state_land_type_desc varchar(10) null,
	prev_st_land_type_cd varchar(10) null,
	ls_code varchar(25) null,
	size_acres numeric(18,4) null,
	ag_val numeric(14,0) null,
	land_seg_mkt_val numeric(14,0) null,
	land_seg_id int not null
)

create nonclustered index IDX_tmp_ptd_land_detail_prop_id_prop_val_yr_sup_num
on #tmp_ptd_land_detail (prop_id, prop_val_yr, sup_num)
with fillfactor = 90

insert into #tmp_ptd_land_detail
(prop_id, sup_num, prop_val_yr, state_cd, ag_use_cd, land_type_cd, state_land_type_desc, 
 prev_st_land_type_cd, ls_code, size_acres, ag_val, land_seg_mkt_val, land_seg_id)

select ld.prop_id, ld.sup_num, ld.prop_val_yr, ld.state_cd, ld.ag_use_cd, ld.ag_land_type_cd,
	lt.state_land_type_desc, ld.prev_st_land_type_cd, IsNull(ls.ls_code,'NSC'), ld.size_acres,
	ld.ag_val, ld.land_seg_mkt_val,ld.land_seg_id
from land_detail as ld
with (nolock)
join land_type as lt
with (nolock)
on ld.ag_land_type_cd = lt.land_type_cd
--join land_sched as ls
left outer join land_sched as ls
with (nolock)
on ld.ls_ag_id = ls.ls_id
and ld.prop_val_yr = ls.ls_year
inner join #as_of_temp_ag asof

on ld.prop_id = asof.prop_id
and ld.prop_val_yr = asof.sup_yr
and ld.sup_num = asof.sup_num
-- Jeremy Wilson 36278 changes
inner join state_code with (nolock)
	on state_code.state_cd = ld.state_cd
where ld.prop_val_yr = @input_year
and   isnull(ld.sale_id,0) = 0
and   ld.ag_apply = 'T'
and   ld.ag_use_cd in ('1D', '1D1', 'TIM')
-- Jeremy Wilson 36278 changes
and   state_code.ptd_state_cd in ('D1',  'D2')
-- and   ld.state_cd in ('D1',  'D2')

create table #tmp_ptd_land_summary
(
	prop_id int not null,
	prop_val_yr numeric(4,0) not null,
	sup_num int not null,
	sum_size_acres numeric(18,4) null,
	sum_ag_val numeric(14,0) null,
	sum_land_seg_mkt_val numeric(14,0) null
)

create nonclustered index IDX_tmp_ptd_land_summary_prop_id_prop_val_yr_sup_num
on #tmp_ptd_land_summary (prop_id, prop_val_yr, sup_num)
with fillfactor = 90

insert #tmp_ptd_land_summary
(prop_id, prop_val_yr, sup_num, sum_size_acres, sum_ag_val, sum_land_seg_mkt_val)

select ld.prop_id, ld.prop_val_yr, ld.sup_num, 
		sum(size_acres) as sum_size_acres, sum(ag_val) as sum_ag_val, 
		sum(land_seg_mkt_val) as sum_land_seg_mkt_val
from land_detail as ld
with (nolock)
join land_type as lt
with (nolock)
on ld.ag_land_type_cd = lt.land_type_cd
inner join #as_of_temp_ag asof

on ld.prop_id = asof.prop_id
and ld.prop_val_yr = asof.sup_yr
and ld.sup_num = asof.sup_num
-- Jeremy Wilson 36278 changes
inner join state_code with (nolock)
	on state_code.state_cd = ld.state_cd
where ld.prop_val_yr = @input_year
and   isnull(ld.sale_id,0) = 0
and   ld.ag_apply = 'T'
and   ld.ag_use_cd in ('1D', '1D1', 'TIM')
-- Jeremy Wilson 36278 changes
and   state_code.ptd_state_cd in ('D1',  'D2')
-- and   ld.state_cd in ('D1',  'D2')
group by ld.prop_id, ld.sup_num, ld.prop_val_yr


create table #tmp_ptd_land_pct
(
	prop_id int not null,
	prop_val_yr numeric(4,0) not null,
	sup_num int not null,
	land_type_cd varchar(10) null,
	state_land_type_desc varchar(10) null,
	prev_st_land_type_cd varchar(10) null,
	pct_acreage numeric(13,10) null,
	pct_ag_val numeric(13,10) null,
	pct_mkt_val numeric(13,10) null,
	pct_ls_code varchar(25) null,
	pct_ag_use_cd varchar(5) not null,
	pct_land_seg_id int not null

)

create nonclustered index IDX_tmp_land_pct_prop_id_prop_val_yr_sup_num
on #tmp_ptd_land_pct (prop_id, prop_val_yr, sup_num)
with fillfactor = 90

insert #tmp_ptd_land_pct 
(prop_id, prop_val_yr, sup_num, land_type_cd, state_land_type_desc, prev_st_land_type_cd, pct_acreage, pct_ag_val, pct_mkt_val,
pct_ls_code, pct_ag_use_cd, pct_land_seg_id)

select tld.prop_id, tld.prop_val_yr, tld.sup_num, tld.land_type_cd,
		tld.state_land_type_desc, tld.prev_st_land_type_cd, 
		case when tls.sum_size_acres > 0 then tld.size_acres/tls.sum_size_acres else 1 end as pct_acreage,
		case when tls.sum_ag_val > 0     then tld.ag_val/tls.sum_ag_val else 1 end as pct_ag_val,
		case when tls.sum_land_seg_mkt_val > 0 then tld.land_seg_mkt_val/tls.sum_land_seg_mkt_val else 1 end as pct_mkt_val,
		tld.ls_code,
		tld.ag_use_cd,
		tld.land_seg_id
from #tmp_ptd_land_detail as tld
with (nolock)
join #tmp_ptd_land_summary as tls
with (nolock)
on tld.prop_id = tls.prop_id
and tld.prop_val_yr = tls.prop_val_yr
and tld.sup_num = tls.sup_num


create table #tmp_ptd_land
(
	entity_id int not null,
	prop_id int not null,
	prop_val_yr numeric(4,0) not null,
	sup_num int not null,
	ls_code varchar(25) null,
	state_cd varchar(10) null,
	land_type_cd varchar(10) null,
	state_land_type_desc varchar(10) null,
	prev_st_land_type_cd varchar(10) null,
	acres_for_production numeric(18,4) null,
	productivity_value_by_land_type numeric(14,0) null,
	market_value_of_land_receiving_productivity numeric(14,0) null,
--	v_acres numeric(18,4) null,
--	v_pct_acreage numeric(18,4) null,
--	v_pct_ag_val numeric(18,4) null,
--	v_pct_mkt_val numeric(18,4) null
)

declare curPOES cursor fast_forward
for select asof.prop_id, poes.sup_num, poes.entity_id, poes.state_cd, poes.acres, poes.ag_use_val, poes.timber_use, 
			poes.ag_market, poes.timber_market
	from property_owner_entity_state_cd as poes
	with (nolock)
	inner join #as_of_temp_ag asof


/* -- as of sup join
	(
			select sup_yr,prop_id,max(sup_num) as sup_num 
			from prop_owner_entity_val as poev with(nolock) 
			where sup_yr = @input_year and poev.sup_num <= @input_sup_num
			group by poev.sup_yr,prop_id 
	) as asof */
	on poes.prop_id = asof.child_id
	and poes.year = asof.sup_yr
	and poes.sup_num = asof.sup_num
	join appraisal_totals as a
	with (nolock)
	on poes.year = a.prop_val_yr
	and poes.entity_id = a.entity_id
	and a.pacs_user_id = @input_pacs_user
	and a.tnt_export_id = @input_tnt_export_id
	and a.arb_status = '0'
	where poes.state_cd = 'D1'
	and poes.year = @input_year

open curPOES

fetch next from curPOES into @prop_id, @sup_num, @entity_id, @state_cd, @acres, @ag_use_val, @timber_use,
		@ag_market, @timber_market

while @@fetch_status = 0
begin
	select @num_land_codes = count(prop_id)
	from #tmp_ptd_land_pct as plp
	with (nolock)
	where prop_id = @prop_id

	set @total_acres_for_category = @acres
	set @total_productivity_value = isnull(@ag_use_val,0) + isnull(@timber_use,0)
	set @total_market_value	= isnull(@ag_market,0) + isnull(@timber_market,0)

	if @num_land_codes > 1
	begin
		set @land_count = 1

		declare curLandPct cursor fast_forward
		for select pct_acreage, pct_ag_val, pct_mkt_val, land_type_cd,
				isnull(state_land_type_desc,'ERROR'),
				prev_st_land_type_cd,
				pct_ls_code,
				pct_ag_use_cd

			from #tmp_ptd_land_pct
			with (nolock)
			where prop_id = @prop_id
			order by pct_land_seg_id


		open curLandPct

		fetch next from curLandPct into @pct_acreage, @pct_ag_val, @pct_mkt_val,
				@land_type_cd, @state_land_type_desc, @prev_st_land_type_cd,
				@ls_code, @ag_use_cd

		while @@fetch_status = 0
		begin
			if @land_count < @num_land_codes
			begin
				set @temp_acres_for_category = @acres * @pct_acreage
				set @temp_productivity_value = (isnull(@ag_use_val,0) + isnull(@timber_use,0)) * @pct_ag_val
				set @temp_market_value_land  = (isnull(@ag_market,0) + isnull(@timber_market,0)) * @pct_mkt_val

				set @total_acres_for_category = @total_acres_for_category - @temp_acres_for_category
				set @total_productivity_value = @total_productivity_value - @temp_productivity_value
				set @total_market_value       = @total_market_value - @temp_market_value_land
			end
			else
			begin
				if (@total_acres_for_category < 0)
				begin
					set @temp_acres_for_category = 0
				end
				else
				begin
					set @temp_acres_for_category = @total_acres_for_category
				end

				if (@total_productivity_value < 0)
				begin
					set @temp_productivity_value = 0
				end
				else
				begin
					set @temp_productivity_value = @total_productivity_value
				end

				if (@total_market_value < 0)
				begin
					set @temp_market_value_land = 0
				end
				else
				begin
					set @temp_market_value_land  = @total_market_value
				end
			end

--			select @ag_use_cd = ag_use_cd,
--					@ls_code = ls_code
--			from #tmp_ptd_land_detail
--			where prop_id = @prop_id
--			and   state_land_type_desc = @state_land_type_desc

			insert #tmp_ptd_land
			(entity_id, prop_id, prop_val_yr, sup_num, ls_code, state_cd, land_type_cd,
			state_land_type_desc, prev_st_land_type_cd, acres_for_production, 
			 productivity_value_by_land_type, market_value_of_land_receiving_productivity
--			 ,
--			 v_acres,
--			 v_pct_acreage,
--			 v_pct_ag_val,
--			 v_pct_mkt_val
			 )
			values
			(@entity_id, @prop_id, @input_year, @sup_num, @ls_code, @state_cd, @land_type_cd, 
			 @state_land_type_desc, @prev_st_land_type_cd, @temp_acres_for_category,
			 @temp_productivity_value, @temp_market_value_land
--			 ,
--			 @acres,
--			 @pct_acreage,
--			 @pct_ag_val,
--			 @pct_mkt_val
			 )

			set @land_count = @land_count + 1

			fetch next from curLandPct into @pct_acreage, @pct_ag_val, @pct_mkt_val,
					@land_type_cd, @state_land_type_desc, @prev_st_land_type_cd,
					@ls_code, @ag_use_cd
		end

		close curLandPct
		deallocate curLandPct
	end
	else
	begin
		set @state_land_type_desc = 'ERROR'
		set @ls_code = ''

		select @land_type_cd = land_type_cd,
				@state_land_type_desc = isnull(state_land_type_desc,'ERROR'),
				@prev_st_land_type_cd = prev_st_land_type_cd,
				@ag_use_cd = ag_use_cd,
				@ls_code = ls_code
		from #tmp_ptd_land_detail
		where prop_id = @prop_id

		insert #tmp_ptd_land
		(entity_id, prop_id, prop_val_yr, sup_num, ls_code, state_cd, land_type_cd,
		 state_land_type_desc, prev_st_land_type_cd, acres_for_production, 
		 productivity_value_by_land_type, market_value_of_land_receiving_productivity)
		values
		(@entity_id, @prop_id, @input_year, @sup_num, @ls_code, @state_cd, @land_type_cd,
		 @state_land_type_desc, @prev_st_land_type_cd, @total_acres_for_category,
		 @total_productivity_value, @total_market_value)
	end


	fetch next from curPOES into @prop_id, @sup_num, @entity_id, @state_cd, @acres, @ag_use_val, @timber_use,

			@ag_market, @timber_market
end


close curPOES
deallocate curPOES


-- acreage detail

insert ptd_mt_state_report_acreage_detail
(entity_id, year, as_of_sup_num, date, land_type_cd, land_acres, land_market_val, land_ag_val,
 ag_or_wild_or_timber, dataset_id)

select distinct entity_id, @input_year, @input_sup_num, getdate(), isnull(state_land_type_desc,'ERROR'), 
		sum(isnull(acres_for_production,0)),
		sum(isnull(market_value_of_land_receiving_productivity,0)),
		sum(isnull(productivity_value_by_land_type,0)), 
		case when state_land_type_desc = 'WDLF' then 'W' else 'A' end, @input_dataset_id
from #tmp_ptd_land
with (nolock)
group by entity_id, state_land_type_desc


-- wildlife breakdown by previous land type

insert ptd_mt_state_report_acreage_wildlife
(entity_id, year, as_of_sup_num, date, prev_land_type_cd,
 land_acres, land_market_val, land_ag_val, dataset_id)

select distinct entity_id, @input_year, @input_sup_num, getdate(), prev_st_land_type_cd, 
		sum(isnull(acres_for_production,0)),
		sum(isnull(market_value_of_land_receiving_productivity,0)),
		sum(isnull(productivity_value_by_land_type,0)), 
		@input_dataset_id
from #tmp_ptd_land with (nolock)
where not prev_st_land_type_cd is null
and state_land_type_desc = 'WDLF'
group by entity_id, prev_st_land_type_cd


-- timber breakdown by previous land type

insert ptd_mt_state_report_acreage_timber
(entity_id, year, as_of_sup_num, date, prev_land_type_cd,
 land_acres, land_market_val, land_ag_val, dataset_id)

select distinct entity_id, @input_year, @input_sup_num, getdate(), prev_st_land_type_cd, 
		sum(isnull(acres_for_production,0)),
		sum(isnull(market_value_of_land_receiving_productivity,0)),
		sum(isnull(productivity_value_by_land_type,0)), 
		@input_dataset_id
from #tmp_ptd_land with (nolock)
where not prev_st_land_type_cd is null
and (state_land_type_desc = 'HDT1' or state_land_type_desc = 'MXT1' or state_land_type_desc = 'PNT1')
group by entity_id, prev_st_land_type_cd




drop table #tmp_ptd_land_detail
drop table #tmp_ptd_land_summary
drop table #tmp_ptd_land_pct



------------------------------------------------------------------------------
-- Call appraisal totals to generate freeze only totals
------------------------------------------------------------------------------
-- Now we are going to call appraisal totals with a PACS user id
-- that is @input_pacs_user ^ 0x70000000, so it doesn't wipe out
-- the first run's data.
-- 
-- The input query will run totals for properties with a freeze 

-- Delete prior data for this user id
exec PopulateFreezeTotals 0, @input_pacs_user_x, 0, '',	'', 0, @input_tnt_export_id

-- Clear criteria for @input_pacs_user_x
delete from appraisal_totals_criteria_entity 
where pacs_user_id=@input_pacs_user_x
delete from appraisal_totals_criteria_proptype
where pacs_user_id=@input_pacs_user_x

-- Insert the original criteria with a different PACS user id
insert into appraisal_totals_criteria_entity 
(
pacs_user_id,
entity_id,
tnt_export_id
)
select @input_pacs_user_x,entity_id, @input_tnt_export_id 
from appraisal_totals_criteria_entity 
where pacs_user_id=@input_pacs_user
and tnt_export_id = @input_tnt_export_id

insert into appraisal_totals_criteria_proptype
(
pacs_user_id,
prop_type_cd,
tnt_export_id
)
select @input_pacs_user_x,prop_type_cd,@input_tnt_export_id 
from appraisal_totals_criteria_proptype 
where pacs_user_id=@input_pacs_user
and tnt_export_id = @input_tnt_export_id


exec PopulateFreezeTotals @input_year, @input_pacs_user_x, @input_sup_num, '', @totals_query, @input_tnt_export_id

------------------------------------------------------------------------------
-- Populate PTD - Entity and School Tax Limitation Report tables
------------------------------------------------------------------------------

-- fill out the entity table
insert into ptd_mt_state_report_entity_tax_limitation
(
entity_id,
entity_type_cd,
year,
as_of_sup_num,
date,
ov65_count,
ov65_appraised_val,

state_amt,
local_amt,

entity_tax_rate,
actual_levy,
dataset_id
)
select 
t.entity_id,
e.entity_type_cd,
prop_val_yr,
@input_sup_num,
GetDate(),
prop_count,

-- Assessed value
land_hstd_val + imprv_hstd_val - ten_percent_cap,

-- State loss amount is the assessed = state exemptions
(	select sum(case when exempt_type_cd = 'HT' then isNull(exempt_state_amt,0) + IsNull(exempt_local_amt, 0)
		   	when exempt_type_cd = 'SO' then isNull(exempt_state_amt,0) + IsNull(exempt_local_amt, 0)
		   	else isnull(exempt_state_amt,0) end )
	from appraisal_totals_exemptions as ee with(nolock) 
	where ee.arb_status='0' 
	and ee.pacs_user_id=@input_pacs_user_x 
	and ee.tnt_export_id = @input_tnt_export_id
	and ee.entity_id=t.entity_id
	
),

-- Local optional amount 
(
	select sum(isnull(exempt_local_amt,0))
	from appraisal_totals_exemptions as ee with(nolock) 
	where (exempt_type_cd like 'OV65%' or exempt_type_cd = 'DP' or exempt_type_cd = 'HS')
		and ee.arb_status='0' and ee.pacs_user_id=@input_pacs_user_x and 
		ee.tnt_export_id = @input_tnt_export_id and ee.entity_id=t.entity_id
),

-- School tax rate
tax_rate,

-- Actual levy
(
	select sum(actual_tax)
	from appraisal_totals_freezes with(nolock)
	where arb_status='0' and entity_id=t.entity_id
	and pacs_user_id=@input_pacs_user_x and tnt_export_id = @input_tnt_export_id
),
@input_dataset_id

from appraisal_totals as t

inner join appraisal_totals_criteria_entity  as el with(nolock) on
el.entity_id=t.entity_id and
el.pacs_user_id=t.pacs_user_id

inner join ptd_mt_state_report as sr with(nolock) on
sr.dataset_id=@input_dataset_id and
sr.entity_id=el.entity_id

inner join entity as e with (nolock)
on t.entity_id = e.entity_id
and (e.entity_type_cd = 'S' or e.entity_type_cd = 'G' or
     e.entity_type_cd = 'C' or e.entity_type_cd = 'J')

where arb_status='0'
and t.pacs_user_id = @input_pacs_user_x 
and t.tnt_export_id = @input_tnt_export_id

-- fill in the total freeze loss
update ptd_mt_state_report_entity_tax_limitation
set freeze_loss = state_amt + local_amt
from ptd_mt_state_report_entity_tax_limitation
where dataset_id = @input_dataset_id

-- copy just the school records to the school table
insert into ptd_mt_state_report_school_tax_limitation
(
entity_id,
year,
as_of_sup_num,
ov65_count,
ov65_appraised_val,
school_tax_rate,
actual_levy,
state_ex_loss,
ov65_local_option_amt,
dataset_id
)
SELECT
etl.entity_id,
etl.year,
etl.as_of_sup_num,
etl.ov65_count,
etl.ov65_appraised_val,
etl.entity_tax_rate,
etl.actual_levy,
etl.state_amt,
etl.local_amt,
etl.dataset_id

from ptd_mt_state_report_entity_tax_limitation etl with (nolock)
where etl.dataset_id = @input_dataset_id
and etl.entity_type_cd = 'S'

-- Set calculated school values
update ptd_mt_state_report_school_tax_limitation
set ov65_taxable_val=ov65_appraised_val-state_ex_loss,
total_levy=(ov65_appraised_val-state_ex_loss)* (school_tax_rate / 100)
from ptd_mt_state_report_school_tax_limitation
where dataset_id=@input_dataset_id

-- Set values in ptd_mt_state_report from ptd_mt_state_report_school_tax_limitation
update ptd_mt_state_report
set school_freeze_loss = case when isnull(school_tax_rate,0) > 0
	then isnull(((total_levy-actual_levy) / school_tax_rate) * 100 - ov65_local_option_amt,0)
	else 0 end
from ptd_mt_state_report_school_tax_limitation with (nolock)
where ptd_mt_state_report.entity_id = ptd_mt_state_report_school_tax_limitation.entity_id
and ptd_mt_state_report.year = ptd_mt_state_report_school_tax_limitation.year
and ptd_mt_state_report.dataset_id = ptd_mt_state_report_school_tax_limitation.dataset_id
and ptd_mt_state_report_school_tax_limitation.dataset_id = @input_dataset_id

--select * from ptd_mt_state_report_school_tax_limitation where dataset_id=1000000

--select * from ptd_mt_state_report where dataset_id=1000000
-- select * from appraisal_totals where pacs_user_id=70000001 and arb_status='0'


-----------------------------------------------------------------------------
-- Populate the top ten taxpayers for each entity
-----------------------------------------------------------------------------

-- Declare a cursor to select each entity
declare e cursor 
for 
select entity_id
from appraisal_totals_criteria_entity  as el with(nolock) 
where pacs_user_id=@input_pacs_user
and tnt_export_id = @input_tnt_export_id


open e
fetch next from e into @entity_id

while @@FETCH_STATUS = 0
begin

	insert into ptd_mt_state_report_top_ten
	(
	entity_id,
	year,
	as_of_sup_num,
	owner_id,
	owner_name,
	total_market_val,
	total_taxable_val,
	dataset_id
	)
	select top 10
	@entity_id,
	@input_year,
	@input_sup_num,
	main_owner_id,
	file_as_name,
	sum(market_val) as market_val,
	sum(taxable_val) as taxable_val,
	@input_dataset_id
	
	from property_val as pv with(nolock)
	inner join prop_owner_entity_val as poev with(nolock) on
	poev.sup_yr=pv.prop_val_yr and 
	poev.sup_num=pv.sup_num and 
	poev.prop_id=pv.prop_id 
	inner join #as_of asof on
	pv.prop_val_yr=asof.sup_yr and 
	pv.sup_num=asof.sup_num and 
	pv.prop_id=asof.prop_id 
	inner join -- Join to get the main owner of the property
	(
		select sup_yr,sup_num,entity_id,prop_id,owner_id,
		case when main_owner_id is null then owner_id else main_owner_id end as main_owner_id
		from prop_owner_entity_val as poev with(nolock)
	 	left outer join owner_links as ol with(nolock) on
		poev.owner_id = ol.child_owner_id	
		where sup_yr= @input_year and poev.entity_id=@entity_id
	) as mo on
	poev.sup_yr=mo.sup_yr and
	poev.sup_num=mo.sup_num and
	poev.entity_id=mo.entity_id and
	poev.prop_id=mo.prop_id and
	poev.owner_id=mo.owner_id 
	inner join account as a with(nolock) on
	a.acct_id=main_owner_id
	where pv.prop_inactive_dt is null and isnull(udi_parent,'')='' and poev.entity_id=@entity_id
	group by main_owner_id,file_as_name -- Group by the main owner
	order by sum(taxable_val) desc

	fetch next from e into @entity_id

end

close e
deallocate e


/*
 * Ag/Timber report
 */

if not(exists(select id from sysobjects where name = 'ptd_ag_timber_report'))
begin
	create table [dbo].[ptd_ag_timber_report]
	(
		dataset_id bigint not null,
		entity_id int not null,
		year	 numeric(4) not null,
		page_num int not null,
		state_cd varchar(10) null,
		state_land_type_desc varchar(10) null,
		land_type_cd varchar(10) null,
		ls_code varchar(25) null,
		number_land_detail numeric(14,0) null,
		acres numeric(18,4) null,
		market_value numeric(14,0) null,
		productivity_use_value numeric(14,0) null,
		average_prod_value_per_acre numeric(14,0) null,
		productivity_loss numeric(14,0) null,
		ag_tim_wdlf_flag char(1) null
	)
end



insert ptd_ag_timber_report
(dataset_id, entity_id, year, page_num, state_cd, state_land_type_desc, land_type_cd, number_land_detail,
 acres, market_value, productivity_use_value, average_prod_value_per_acre,
 productivity_loss, ag_tim_wdlf_flag)


select @input_dataset_id, l.entity_id, @input_year, 1, l.state_cd, l.state_land_type_desc, l.land_type_cd, 
		count(distinct l.prop_id) as number_land_detail, 
		sum(l.acres_for_production) as acres, 
		sum(l.market_value_of_land_receiving_productivity) as market_value,
		sum(l.productivity_value_by_land_type) as productivity_use_value, 
		avg(case when l.acres_for_production > 0 then l.productivity_value_by_land_type / l.acres_for_production else 0 end) as average_prod_value_per_acre, 
		sum(l.market_value_of_land_receiving_productivity - l.productivity_value_by_land_type) as productivity_loss,
		'A'
from #tmp_ptd_land as l
with (nolock)
where l.state_land_type_desc <> 'WDLF'
group by l.entity_id, l.state_cd, l.state_land_type_desc, l.land_type_cd
order by l.entity_id, l.state_land_type_desc, l.land_type_cd


insert ptd_ag_timber_report
(dataset_id, entity_id, year, page_num, state_cd, state_land_type_desc, ls_code, number_land_detail,
 acres, market_value, productivity_use_value, average_prod_value_per_acre,
 productivity_loss, ag_tim_wdlf_flag)


select @input_dataset_id, l.entity_id, @input_year, 2, l.state_cd, l.state_land_type_desc, l.ls_code, 
		count(distinct l.prop_id) as number_land_detail, 
		sum(l.acres_for_production) as acres, 
		sum(l.market_value_of_land_receiving_productivity) as market_value,
		sum(l.productivity_value_by_land_type) as productivity_use_value, 
		avg(case when l.acres_for_production > 0 then l.productivity_value_by_land_type / l.acres_for_production else 0 end) as average_prod_value_per_acre, 
		sum(l.market_value_of_land_receiving_productivity - l.productivity_value_by_land_type) as productivity_loss,
		'A'
from #tmp_ptd_land as l
with (nolock)
where l.state_land_type_desc <> 'WDLF'
group by l.entity_id, l.state_cd, l.state_land_type_desc, l.ls_code
order by l.entity_id, l.state_land_type_desc, l.ls_code



insert ptd_ag_timber_report
(dataset_id, entity_id, year, page_num, state_cd, state_land_type_desc, land_type_cd, number_land_detail,
 acres, market_value, productivity_use_value, average_prod_value_per_acre,
 productivity_loss, ag_tim_wdlf_flag)


select @input_dataset_id, l.entity_id, @input_year,  1, l.state_cd, l.state_land_type_desc, l.land_type_cd, 
		count(distinct l.prop_id) as number_land_detail, 
		sum(l.acres_for_production) as acres, 
		sum(l.market_value_of_land_receiving_productivity) as market_value,
		sum(l.productivity_value_by_land_type) as productivity_use_value, 
		avg(case when l.acres_for_production > 0 then l.productivity_value_by_land_type / l.acres_for_production else 0 end) as average_prod_value_per_acre, 
		sum(l.market_value_of_land_receiving_productivity - l.productivity_value_by_land_type) as productivity_loss,
		'W'
from #tmp_ptd_land as l
with (nolock)
where l.state_land_type_desc = 'WDLF'
group by l.entity_id, l.state_cd, l.state_land_type_desc, l.land_type_cd

order by l.entity_id, l.state_land_type_desc, l.land_type_cd


insert ptd_ag_timber_report
(dataset_id, entity_id, year, page_num, state_cd, state_land_type_desc, ls_code, number_land_detail,
 acres, market_value, productivity_use_value, average_prod_value_per_acre,
 productivity_loss, ag_tim_wdlf_flag)


select @input_dataset_id, l.entity_id, @input_year, 2, l.state_cd, l.state_land_type_desc, l.ls_code, 
		count(distinct l.prop_id) as number_land_detail, 
		sum(l.acres_for_production) as acres, 
		sum(l.market_value_of_land_receiving_productivity) as market_value,
		sum(l.productivity_value_by_land_type) as productivity_use_value, 
		avg(case when l.acres_for_production > 0 then l.productivity_value_by_land_type / l.acres_for_production else 0 end) as average_prod_value_per_acre, 
		sum(l.market_value_of_land_receiving_productivity - l.productivity_value_by_land_type) as productivity_loss,
		'W'
from #tmp_ptd_land as l
with (nolock)
where l.state_land_type_desc = 'WDLF'
group by l.entity_id, l.state_cd, l.state_land_type_desc, l.ls_code
order by l.entity_id, l.state_land_type_desc, l.ls_code

drop table #tmp_ptd_land

GO

