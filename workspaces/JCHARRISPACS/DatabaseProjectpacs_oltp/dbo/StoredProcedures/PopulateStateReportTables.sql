


CREATE PROCEDURE PopulateStateReportTables

	@input_yr numeric(4)

as

--Version History
--1.0 Creation
--1.1 Commented out 'prop_val_id' references; EricZ 03/25/2004

--Clear appropriate tables
delete from ptd_state_report
where year = @input_yr

delete from ptd_state_report_tvb
where year = @input_yr

delete from ptd_state_report_school_tax_limitation
where year = @input_yr

delete from ptd_state_report_acreage_detail
where year = @input_yr


delete from ptd_state_report_top_ten
where year = @input_yr

--Now populate the ptd_state_report tables
insert into ptd_state_report
(
	entity_id,
	year,
	as_of_sup_num,
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
	fmfc_dp_local_option_loss_count,
	fmfc_ov65_local_option_loss_count,
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
	waterconservation_loss_count,
	waterconservation_loss_amt,
	productivity_acres,
	productivity_value_loss,
	abatement_loss_count,
	abatement_loss,
	taxincrement_loss_count,
	taxincrement_loss,
	other_loss,
	historical_loss_count,
	historical_loss,
	hs_cap_loss,
	school_freeze_loss,
	fmfc_taxable_val,
	taxable_val,
	m_n_o_tax_rate,
	i_n_s_tax_rate,
	total_tax_rate,
	fmfc_m_n_o_tax_rate,
	fmfc_i_n_s_tax_rate,
	fmfc_tax_rate,
	general_fund_m_n_o_tax_rate,
	general_fund_i_n_s_tax_rate,
	general_fund_tax_rate,
	road_bridge_m_n_o_tax_rate,
	road_bridge_i_n_s_tax_rate,
	road_bridge_tax_rate,
	actual_tax_levy,
	actual_fmfc_tax_levy,
	actual_general_fund_tax_levy,
	actual_road_bridge_tax_levy,
	hs_cap_appraised_val,
	hs_cap_assessed_val,
	total_appraised_value_with_abatements,
	total_taxable_value_with_abatements,
	levy_lost_to_tax_deferral_of_ov65,
	abatement_appraised_before_may311993 ,
	abatement_taxable_before_may311993,
	abatement_appraised_after_may311993,
	abatement_taxable_after_may311993,
	other_loss_count,
	certified_market_value,
	uncertified_market_value,
	industrial_exemptions
	
)
select
entity.entity_id,
@input_yr,
0,
GetDate(),
sum(isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0)
+ isNull(ptd_ajr.personal_property_value, 0) + isnull(ptd_ajr.mineral_value, 0) + isnull(ptd_ajr.total_exemption_amount, 0) ),
sum(isnull(ptd_ajr.total_exemption_amount, 0)),
sum(case when ptd_ajr.state_mandated_homestead_exemption_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.state_mandated_homestead_exemption_amount, 0)),
sum(case when ptd_ajr.state_mandated_homestead_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B' then 1 else 0 end),
sum(case when ptd_ajr.state_mandated_homestead_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B' then isnull(ptd_ajr.state_mandated_homestead_exemption_amount, 0) else 0 end),
sum(case when ptd_ajr.state_mandated_over6555_surviving_spouse_exemption_indicator = 'Y' then 1 else 0 end),
sum(case when ptd_ajr.state_mandated_disabled_homeowner_exemption_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.state_mandated_over65_homeowner_exemption_amount, 0) + isnull(ptd_ajr.state_mandated_disabled_homeowner_exemption_amount, 0)),

sum(case when (ptd_ajr.local_optional_over6555_surviving_spouse_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind <> 'B') then 1 else 0 end),
sum(case when (ptd_ajr.local_optional_disabled_homeowner_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind <> 'B') then 1 else 0 end),
sum((case when (ptd_ajr.local_optional_over6555_surviving_spouse_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind <> 'B') then isnull(ptd_ajr.local_optional_over65_homeowner_exemption_amount, 0) else 0 end) 
+ (case when (ptd_ajr.local_optional_disabled_homeowner_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind  <> 'B') then isnull(ptd_ajr.local_optional_disabled_homeowner_exemption_amount, 0) else 0 end)),


sum(case when (ptd_ajr.local_optional_over6555_surviving_spouse_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B') then 1 else 0 end),
sum(case when (ptd_ajr.local_optional_disabled_homeowner_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B') then 1 else 0 end),
sum((case when (ptd_ajr.local_optional_over6555_surviving_spouse_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B') then isnull(ptd_ajr.local_optional_over65_homeowner_exemption_amount, 0) else 0 end) 
+ (case when (ptd_ajr.local_optional_disabled_homeowner_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B') then isnull(ptd_ajr.local_optional_disabled_homeowner_exemption_amount, 0) else 0 end)),

isnull(entity_exmpt.local_option_pct, 0),
sum(case when ptd_ajr.local_optional_percentage_homestead_exemption_indicator = 'Y' then 1 else 0 end),
sum(isnull(local_optional_percentage_homestead_exemption_amount, 0)),


sum(case when (ptd_ajr.state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind <> 'B') then 1 else 0 end),
sum(case when (ptd_ajr.state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind <> 'B') then isnull(ptd_ajr.state_mandated_disabled_deceased_veteran_exemption_amount, 0) else 0 end),
sum(case when (ptd_ajr.state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B') then 1 else 0 end),
sum(case when (ptd_ajr.state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'Y' and ptd_ajr.county_fund_type_ind = 'B') then isnull(ptd_ajr.state_mandated_disabled_deceased_veteran_exemption_amount, 0) else 0 end),

sum(case when ptd_ajr.freeport_exemption_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.freeport_exemption_loss, 0)),
sum(case when ptd_ajr.pollution_control_exemption_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.pollution_control_exemption_loss, 0)),
sum(case when ptd_ajr.water_conservation_initiatives_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.water_conservation_initiatives_exemption_amount, 0)),
sum(case when (comptrollers_category_code = 'D1' ) then ptd_ajr.total_acres_for_category else 0 end),
sum(case when (comptrollers_category_code = 'D1'  ) then isnull(ptd_ajr.productivity_value_loss, 0) else 0 end),
--sum(case when (ptd_ajr.certified_value_indicator = 'Y' and ptd_ajr.comptrollers_category_code = 'D1') then ptd_ajr.total_acres_for_category else 0 end),
--sum(case when (ptd_ajr.certified_value_indicator = 'Y' and ptd_ajr.comptrollers_category_code = 'D1') then isnull(ptd_ajr.productivity_value_loss, 0) else 0 end),
sum(case when ptd_ajr.abatements_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993, 0) + isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993, 0) 
+ isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements, 0)),
sum(case when ptd_ajr.tax_increment_financing_indicator = 'Y' then 1 else 0 end),
sum(isnull(ptd_ajr.tax_increment_financing_captured_appraised_value_loss, 0)),
sum(isnull(ptd_ajr.solar_wind_powered_exemption_amount, 0) + isnull(ptd_ajr.proration_loss_to_property, 0)),
sum(case when isnull(ptd_ajr.local_optional_historical_exemption_amount, 0) <> 0 then 1 else 0 end),
sum(isnull(ptd_ajr.local_optional_historical_exemption_amount, 0) + isnull(ptd_ajr.other_exemption_loss_amount, 0)),
sum(case when ptd_ajr.hscap_on_residential_homesteads_indicator = 'Y' then isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0) else 0 end), 
0, --school_freeze_loss,
sum(case when ptd_ajr.county_fund_type_ind = 'B' then isnull(ptd_ajr.account_taxable_value, 0) else 0 end),
sum(case when ptd_ajr.county_fund_type_ind <> 'B' then isnull(ptd_ajr.account_taxable_value, 0) else 0 end),
isnull(tax_rate.m_n_o_tax_pct, 0),
(isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)),
(isnull(tax_rate.m_n_o_tax_pct, 0) + isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)),
case when ptd_ajr.county_fund_type_ind = 'B' then isnull(tax_rate.m_n_o_tax_pct, 0) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'B' then (isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'B' then (isnull(tax_rate.m_n_o_tax_pct, 0) + isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'A' then isnull(tax_rate.m_n_o_tax_pct, 0) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'A' then (isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'A' then (isnull(tax_rate.m_n_o_tax_pct, 0) + isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'C' then isnull(tax_rate.m_n_o_tax_pct, 0) else 0 end,case when ptd_ajr.county_fund_type_ind = 'C' then (isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)) else 0 end,
case when ptd_ajr.county_fund_type_ind = 'C' then (isnull(tax_rate.m_n_o_tax_pct, 0) + isnull(tax_rate.i_n_s_tax_pct, 0) + isnull(tax_rate.prot_i_n_s_tax_pct, 0)) else 0 end,
0, --actual_tax_levy (populated later),
0, --actual_fmfc_tax_levy,
0, --actual_general_fund_tax_levy,
0, --actual_road_bridge_tax_levy,
sum(case when ptd_ajr.hscap_on_residential_homesteads_indicator = 'Y' then (isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0) + isnull(ptd_ajr.personal_property_value, 0) 
+ isnull(ptd_ajr.mineral_value, 0)) else 0 end),
sum(case when ptd_ajr.hscap_on_residential_homesteads_indicator = 'Y' then isnull(capped_value_of_residential_homesteads, 0) else 0 end),

sum(case when ptd_ajr.abatements_indicator = 'Y' 
then (isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + 
isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0) + 
isnull(ptd_ajr.personal_property_value, 0) + 
isnull(ptd_ajr.mineral_value, 0)
- isNull(ptd_ajr.productivity_value_loss, 0) - 
isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0)) else 0 end),

sum(case when ptd_ajr.abatements_indicator = 'Y' then

(isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + 
isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0) + 
isnull(ptd_ajr.personal_property_value, 0) + 
isnull(ptd_ajr.mineral_value, 0)
- isNull(ptd_ajr.productivity_value_loss, 0) - 
isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0)) - 

isnull(total_appraised_value_lost_due_to_tax_abatement_agreements, 0) 

 else 0 end),
sum(isnull(ptd_ajr.levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes, 0)),


/* abatements */
sum(case when isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993, 0) > 0 then (isnull (ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap,

 0) + isnull(ptd_ajr.personal_property_value, 0) + isnull(ptd_ajr.mineral_value, 0) - isNull(ptd_ajr.productivity_value_loss, 0) - isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0)) else 0 end),
sum(case when IsNull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993, 0) > 0 
then 
(isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + 
isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0) + 
isnull(ptd_ajr.personal_property_value, 0) + 
isnull(ptd_ajr.mineral_value, 0)- isNull(ptd_ajr.productivity_value_loss, 0) - 
isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0)) - 
isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993, 0) else 0 end),

sum(case when isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993, 0)  > 0 then (isnull (ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap,

 0) + isnull(ptd_ajr.personal_property_value, 0) + isnull(ptd_ajr.mineral_value, 0) - isNull(ptd_ajr.productivity_value_loss, 0) - isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0)) else 0 end),

sum(case when IsNull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993, 0)  > 0 
then 

(isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + 
isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0) + 
isnull(ptd_ajr.personal_property_value, 0) + 
isnull(ptd_ajr.mineral_value, 0)
- isNull(ptd_ajr.productivity_value_loss, 0) - 
isnull(ptd_ajr.value_loss_to_the_hscap_on_residential_homesteads, 0)) - 

isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993, 0) else 0 end),

/* end abatements */

/* new stuff - 10/08/2003 */
sum(case when isnull(ptd_ajr.solar_wind_powered_exemption_amount, 0) <> 0 then 1 else 0 end + case when isnull(ptd_ajr.proration_loss_to_property, 0) <> 0 then 1 else 0 end),
sum(case when ptd_ajr.certified_value_indicator = 'A' then isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0)
+ isNull(ptd_ajr.personal_property_value, 0) + isnull(ptd_ajr.mineral_value, 0) + isnull(ptd_ajr.total_exemption_amount, 0) else 0 end),
sum(case when ptd_ajr.certified_value_indicator = 'C' then isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0)
+ isNull(ptd_ajr.personal_property_value, 0) + isnull(ptd_ajr.mineral_value, 0) + isnull(ptd_ajr.total_exemption_amount, 0) else 0 end),
sum(case when ptd_ajr.comptrollers_category_code IN ('F1','L2') then
	isnull(ptd_ajr.freeport_exemption_loss, 0) +
	isnull(ptd_ajr.pollution_control_exemption_loss, 0) +
	isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993, 0) + 
	isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993, 0) +
	isnull(ptd_ajr.total_appraised_value_lost_due_to_tax_abatement_agreements, 0) +
	isnull(ptd_ajr.total_exemption_amount, 0) +
	isnull(ptd_ajr.state_mandated_homestead_exemption_amount, 0) +
	isnull(ptd_ajr.state_mandated_over65_homeowner_exemption_amount, 0) +
	isnull(ptd_ajr.local_optional_over65_homeowner_exemption_amount, 0) +
	isnull(ptd_ajr.local_optional_disabled_homeowner_exemption_amount, 0) +
	isnull(ptd_ajr.state_mandated_disabled_deceased_veteran_exemption_amount, 0) +
	isnull(ptd_ajr.water_conservation_initiatives_exemption_amount, 0) +
	isnull(ptd_ajr.solar_wind_powered_exemption_amount, 0) +
	isnull(ptd_ajr.local_optional_historical_exemption_amount, 0)
	else 0 end)


from entity   with (nolock)
inner join ptd_ajr  with (nolock) on
replace(entity.taxing_unit_num, '-', '') = ptd_ajr.taxing_unit_id_code and 
isnull(entity.ptd_multi_unit, '') = isnull(ptd_ajr.county_fund_type_ind, '')
inner join tax_rate with (nolock) on 
entity.entity_id = tax_rate.entity_id and 
tax_rate.tax_rate_yr = @input_yr 
left outer join entity_exmpt on
tax_rate.entity_id = entity_exmpt.entity_id and
tax_rate.tax_rate_yr = entity_exmpt.exmpt_tax_yr and
entity_exmpt.exmpt_type_cd = 'HS'

group by entity.entity_id, entity_exmpt.local_option_pct, tax_rate.m_n_o_tax_pct, tax_rate.i_n_s_tax_pct, tax_rate.prot_i_n_s_tax_pct, entity.taxing_unit_num, ptd_ajr.county_fund_type_ind

--Populate levy information

--Populate levy information
update ptd_state_report set actual_tax_levy = ptd_levy_total_vw.total_amt,
actual_fmfc_tax_levy = 0,
actual_general_fund_tax_levy = 0,
actual_road_bridge_tax_levy = 0
from ptd_levy_total_vw with (nolock)
where ptd_levy_total_vw.entity_id = ptd_state_report.entity_id and
ptd_levy_total_vw.sup_tax_yr = ptd_state_report.year and
ptd_levy_total_vw.sup_tax_yr = @input_yr

update ptd_state_report set actual_general_fund_tax_levy = ptd_levy_total_vw.total_amt
from ptd_levy_total_vw with (nolock),
     entity with (nolock)
where ptd_levy_total_vw.entity_id = ptd_state_report.entity_id and
ptd_levy_total_vw.sup_tax_yr = ptd_state_report.year and
ptd_levy_total_vw.sup_tax_yr = @input_yr and
ptd_levy_total_vw.entity_id  = entity.entity_id and 
ptd_multi_unit = 'A' and entity_type_cd = 'G'

update ptd_state_report set actual_road_bridge_tax_levy = ptd_levy_total_vw.total_amt
from ptd_levy_total_vw with (nolock),
     entity with (nolock)
where ptd_levy_total_vw.entity_id = ptd_state_report.entity_id and
ptd_levy_total_vw.sup_tax_yr = ptd_state_report.year and
ptd_levy_total_vw.sup_tax_yr = @input_yr and
ptd_levy_total_vw.entity_id  = entity.entity_id and 
ptd_multi_unit = 'C' and entity_type_cd = 'G'


update ptd_state_report set actual_fmfc_tax_levy = ptd_levy_total_vw.total_amt
from ptd_levy_total_vw with (nolock),
     entity with (nolock)
where ptd_levy_total_vw.entity_id = ptd_state_report.entity_id and
ptd_levy_total_vw.sup_tax_yr = ptd_state_report.year and
ptd_levy_total_vw.sup_tax_yr = @input_yr and
ptd_levy_total_vw.entity_id  = entity.entity_id and 
entity_type_cd = 'R'




--Populate the state category codes along with the count, acreage, and amounts
insert into ptd_state_report_tvb
(
	entity_id,
	year,
	as_of_sup_num,
	date,
	category_cd,
	category_count,
	category_acres,
	category_amt
)
select
entity.entity_id,
@input_yr,
0,
GetDate(),
ptd_ajr.comptrollers_category_code as category,
count(*) as number,
sum(case when  ptd_ajr.comptrollers_category_code like 'D%' and land_units = 1 then isnull(ptd_ajr.total_acres_for_category, 0) else 0 end) as acres,
sum(isnull(ptd_ajr.category_market_value_land_before_any_cap, 0) + isnull(ptd_ajr.category_market_value_improvement_before_any_cap, 0) + isnull(ptd_ajr.personal_property_value, 0) + isnull(ptd_ajr.mineral_value, 0) ) as amount
from entity  with (nolock),
     ptd_ajr with (nolock)
where replace(entity.taxing_unit_num, '-', '') = ptd_ajr.taxing_unit_id_code
and isnull(entity.ptd_multi_unit, '') = isnull(ptd_ajr.county_fund_type_ind, '')
group by entity.entity_id, ptd_ajr.comptrollers_category_code
order by ptd_ajr.comptrollers_category_code


-------------------------------------------------
--Populate the school tax limitation report
-------------------------------------------------
-- Section added by Osvaldo 11/26/2000 to match last year's version.

delete from ptd_state_report_school_tax_limitation where year =  @input_yr

exec ptd_set_actual_tax @input_yr

select pee.prop_id, owner_id, exmpt_tax_yr, pee.sup_num, freeze_ceiling
into #freeze_ceiling
from property_exemption as pee
with (nolock)
inner join ptd_supp_assoc
with (nolock)
on pee.freeze_yr <= ptd_supp_assoc.sup_yr
and pee.prop_id = ptd_supp_assoc.prop_id
and pee.exmpt_tax_yr = ptd_supp_assoc.sup_yr
and pee.sup_num = ptd_supp_assoc.sup_num
where exmpt_type_cd IN ('OV65','OV65S')
and isnull(use_freeze,'F') = 'T'
and freeze_ceiling is not null

/*
insert into ptd_state_report_school_tax_limitation 
(entity_id, year, as_of_sup_num, ov65_count, ov65_appraised_val, actual_levy,  state_ex_loss)
select distinct entity_id, sup_yr, 0, freeze_count, assessed_val, ptd_actual_tax, assessed_val - taxable_val
from freeze_totals with (nolock)
where freeze_totals.sup_yr = @input_yr
*/

insert into ptd_state_report_school_tax_limitation
(entity_id, year, as_of_sup_num, ov65_count, ov65_appraised_val, actual_levy, state_ex_loss)
--select distinct entity_id, sup_yr, 0, freeze_count, assessed_val, ptd_actual_tax, assessed_val - taxable_val
SELECT prop_owner_entity_val.entity_id, 
    prop_owner_entity_val.sup_yr,
	0,
    COUNT(prop_owner_entity_val.prop_id) AS freeze_count, 
    SUM(ISNULL(prop_owner_entity_val.frz_assessed_val,0)) AS assessed_val, 
    sum(ISNULL(prop_owner_entity_val.ptd_actual_tax,0)) as ptd_actual_tax,
	SUM(ISNULL(prop_owner_entity_val.frz_assessed_val,0) - ISNULL(prop_owner_entity_val.frz_taxable_val,0))
FROM ptd_supp_assoc with (nolock) 
INNER JOIN prop_owner_entity_val with (nolock) 
ON ptd_supp_assoc.prop_id = prop_owner_entity_val.prop_id 
AND ptd_supp_assoc.sup_yr = prop_owner_entity_val.sup_yr
AND ptd_supp_assoc.sup_num = prop_owner_entity_val.sup_num 
INNER JOIN #freeze_ceiling as fc
with (nolock)
on prop_owner_entity_val.sup_yr = fc.exmpt_tax_yr
and prop_owner_entity_val.sup_num = fc.sup_num
and prop_owner_entity_val.prop_id = fc.prop_id
and prop_owner_entity_val.owner_id = fc.owner_id
INNER JOIN entity_prop_assoc as epa
with (nolock)
on prop_owner_entity_val.prop_id = epa.prop_id
and prop_owner_entity_val.sup_num = epa.sup_num
and prop_owner_entity_val.sup_yr = epa.tax_yr
and prop_owner_entity_val.entity_id = epa.entity_id
INNER JOIN entity as e
with (nolock)
on prop_owner_entity_val.entity_id = e.entity_id
and e.entity_type_cd = 'S'
INNER JOIN property_val 
with (nolock) 
ON ptd_supp_assoc.prop_id = property_val.prop_id
--AND ptd_supp_assoc.prop_id = property_val.prop_val_id
AND ptd_supp_assoc.sup_yr = property_val.prop_val_yr
AND ptd_supp_assoc.sup_num = property_val.sup_num
AND property_val.prop_inactive_dt is null
GROUP BY prop_owner_entity_val.entity_id, 
    prop_owner_entity_val.sup_yr


drop table #freeze_ceiling

/*
delete from ptd_state_report_school_tax_limitation
where entity_id not in (select entity_id from entity where entity_type_cd = 'S')
*/

update ptd_state_report_school_tax_limitation
set school_tax_rate = ptd_state_report.total_tax_rate
from ptd_state_report with (nolock)
where ptd_state_report_school_tax_limitation.entity_id = ptd_state_report.entity_id
and ptd_state_report_school_tax_limitation.year = ptd_state_report.year
and ptd_state_report_school_tax_limitation.year =  @input_yr

if exists (select * from sysobjects where id = object_id(N'[dbo].[_temp8]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_temp8]

select 
a.exmpt_tax_yr, a.entity_id, count(*) as counts, sum(state_amt) as state_amt, sum(local_amt) as local_amt 
into [dbo].[_temp8]
from property_entity_exemption as a with (nolock) , 
ptd_supp_assoc as b with (nolock), 
property_exemption as c with (nolock),
owner as d with (nolock)
where a.prop_id = b.prop_id
and a.sup_num = b.sup_num
and a.exmpt_tax_yr = b.sup_yr
and a.prop_id = c.prop_id
and a.owner_id = c.owner_id
and a.exmpt_tax_yr = c.exmpt_tax_yr
and a.sup_num = c.sup_num
and a.exmpt_type_cd = c.exmpt_type_cd
and a.exmpt_tax_yr =  @input_yr
and a.prop_id = d.prop_id
and a.owner_id = d.owner_id
and a.sup_num  = d.sup_num
and a.exmpt_tax_yr = d.owner_tax_yr
and not exists (select * from property_val with (nolock)
		where prop_id = b.prop_id
		and   sup_num = b.sup_num
		and   prop_val_yr = b.sup_yr
		and   prop_inactive_dt is not null)
and (  (c.exmpt_type_cd = 'OV65' 
        and c.freeze_ceiling is not null
        and c.freeze_yr is not null
        and   c.use_freeze is not null
	and   c.use_freeze = 'T'
	and  c.freeze_yr <= @input_yr
	and   c.freeze_yr is not null
	and   c.freeze_ceiling is not null)
	or 
	(c.exmpt_type_cd = 'OV65S' 
        and c.freeze_ceiling is not null
        and c.freeze_yr is not null
        and   c.use_freeze is not null
	and   c.use_freeze = 'T'
	and  c.freeze_yr <= @input_yr
	and   c.freeze_yr is not null
	and   c.freeze_ceiling is not null)
	or 
	(c.exmpt_type_cd = 'DP' 
        and c.freeze_ceiling is not null
        and c.freeze_yr is not null
        and   c.use_freeze is not null
	and   c.use_freeze = 'T'
	and  c.freeze_yr <= @input_yr
	and   c.freeze_yr is not null
	and   c.freeze_ceiling is not null)
	or 
	(c.exmpt_type_cd like '%DV%'
         and exists (select * from property_exemption with (nolock)
		     where prop_id = d.prop_id
		     and   sup_num = d.sup_num
		     and   owner_tax_yr = d.owner_tax_yr
		     and   exmpt_tax_yr = d.owner_tax_yr
		     and   owner_id     = d.owner_id
		     and  (exmpt_type_cd = 'OV65'
		     or    exmpt_type_cd = 'OV65S'
			 or    exmpt_type_cd = 'DP')
		     and   use_freeze is not null
		     and   use_freeze = 'T'
		     and   freeze_yr <= @input_yr
		     and   freeze_yr is not null
		     and   freeze_ceiling is not null)) 
	or 
	(c.exmpt_type_cd = 'HS'
	 and exists (select * from property_exemption with (nolock)
		     where prop_id = d.prop_id
		     and   sup_num = d.sup_num
		     and   owner_tax_yr = d.owner_tax_yr
		     and   exmpt_tax_yr = d.owner_tax_yr
		     and   owner_id     = d.owner_id
		     and  (exmpt_type_cd = 'OV65'
		     or    exmpt_type_cd = 'OV65S'
			 or	   exmpt_type_cd = 'DP')
		     and   use_freeze is not null
		     and   use_freeze = 'T'
		     and   freeze_yr <= @input_yr
		     and   freeze_yr is not null
		     and   freeze_ceiling is not null)))
group by a.exmpt_tax_yr, a.entity_id

update ptd_state_report_school_tax_limitation
set state_ex_loss = state_ex_loss - [dbo].[_temp8].local_amt,
      ov65_local_option_amt = [dbo].[_temp8].local_amt
from [dbo].[_temp8] with (nolock)
where ptd_state_report_school_tax_limitation.year = [dbo].[_temp8].exmpt_tax_yr
and ptd_state_report_school_tax_limitation.entity_id = [dbo].[_temp8].entity_id


--update ptd_state_report_school_tax_limitation
--set ov65_local_option_amt = 0


update ptd_state_report_school_tax_limitation
set ov65_taxable_val = ov65_appraised_val - state_ex_loss

update ptd_state_report_school_tax_limitation 
set total_levy = ov65_taxable_val * (school_tax_rate / 100)


--Populate the ptd_state_report_acreage_detail table to fuel the PTD Ag Acreage Detail report
insert into ptd_state_report_acreage_detail
(
	entity_id,
	year,
	as_of_sup_num,
	date,
	land_type_cd,
	land_acres,
	land_market_val,
	land_ag_val,
	ag_or_wild_or_timber
)
select
entity.entity_id,
@input_yr,
0,
GetDate(),
ptd_aud.land_type,
sum(isnull(ptd_aud.acres_for_production, 0)),
sum(isnull(ptd_aud.market_value_of_land_receiving_productivity, 0)),
sum(isnull(ptd_aud.productivity_value_by_land_type, 0)),
'A'
from entity with (nolock), 
     ptd_aud with (nolock)
where replace(entity.taxing_unit_num, '-', '') = ptd_aud.taxing_unit_id_code
and ptd_aud.land_type is not null
group by entity.entity_id, ptd_aud.land_type
order by entity.entity_id


--Establish Ag, Wildlife or Timber in transition
--update ptd_state_report_acreage_detail
--set ag_or_wild_or_timber = land_type.ag_or_wild_or_timber
--from land_type
--where ptd_state_report_acreage_detail.land_type_cd = land_type.state_land_type_desc

--Populate the Top Ten Taxpayer Report tables
insert into ptd_state_report_top_ten
(
	entity_id,
	year,
	as_of_sup_num,
	owner_id,
	owner_name,
	total_market_val,
	total_taxable_val
)
select entity_id,
       year,
       0,
       owner_id,
       owner_name,
       market_val,
       taxable_val
from ptd_tu
	
	
	




--Populate School Stratification Tables 

declare @entity_id int

DECLARE ENTITY_ID CURSOR FAST_FORWARD
FOR select entity_id from ptd_state_report with (nolock) where year = @input_yr

OPEN ENTITY_ID
FETCH NEXT FROM ENTITY_ID into @entity_id

while (@@FETCH_STATUS = 0)
begin
	exec PopulatePTDStrataInfoNew @input_yr, @entity_id, 'A'
	exec PopulatePTDStrataInfoNew @input_yr, @entity_id, 'B'
	exec PopulatePTDStrataInfoNew @input_yr, @entity_id, 'C'
	exec PopulatePTDStrataInfoNew @input_yr, @entity_id, 'F1'
	exec PopulatePTDStrataInfoNew @input_yr, @entity_id, 'L1'

	FETCH NEXT FROM ENTITY_ID into @entity_id
end

CLOSE ENTITY_ID
DEALLOCATE ENTITY_ID

/* update freeze loss */

update ptd_state_report set school_freeze_loss = ((((total_levy - actual_levy)/school_tax_rate) * 100 ) - ov65_local_option_amt)
from ptd_state_report_school_tax_limitation with (nolock)
where ptd_state_report.entity_id = ptd_state_report_school_tax_limitation.entity_id
and     ptd_state_report.year = ptd_state_report_school_tax_limitation.year
and     school_tax_rate > 0


update ptd_state_report set school_freeze_loss = 0
from ptd_state_report_school_tax_limitation with (nolock)
where ptd_state_report.entity_id = ptd_state_report_school_tax_limitation.entity_id
and     ptd_state_report.year = ptd_state_report_school_tax_limitation.year
and     school_tax_rate <=  0

GO

