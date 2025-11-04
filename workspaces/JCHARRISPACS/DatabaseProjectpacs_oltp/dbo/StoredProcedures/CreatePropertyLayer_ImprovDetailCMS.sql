create procedure CreatePropertyLayer_ImprovDetailCMS
	@lInputFromYear numeric(4,0),
	@lCopyToYear numeric(4,0),
	@CalledBy varchar(50) 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
declare @proc varchar(500)
set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
       + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy

exec dbo.CurrentActivityLogInsert @proc, @qry

-- set variable for final status entry
set @qry = Replace(@qry,'Start','End') 
/* End top of each procedure to capture parameters */

-- Estimates
insert imprv_detail_cms_estimate with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	zip_code,
	effective_year_built,
	effective_age_adjustment,
	quality_rank,
	local_multiplier,
	local_multiplier_override,
	base_date,
	report_date,
	dep_type,
	dep_pct,
	dep_typical_life,
	dep_physical,
	dep_functional,
	dep_physical_functional,
	dep_external,
	dep_additional_functional,
	calculated_date,
	total_area,
	total_cost_new,
	total_cost_unit_price,
	total_depreciation_amount,
	total_depreciated_cost
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	cms.prop_id,
	cms.imprv_id,
	cms.imprv_det_id,
	cms.zip_code,
	cms.effective_year_built,
	cms.effective_age_adjustment,
	cms.quality_rank,
	cms.local_multiplier,
	cms.local_multiplier_override,
	cms.base_date,
	cms.report_date,
	cms.dep_type,
	cms.dep_pct,
	cms.dep_typical_life,
	cms.dep_physical,
	cms.dep_functional,
	cms.dep_physical_functional,
	cms.dep_external,
	cms.dep_additional_functional,
	cms.calculated_date,
	cms.total_area,
	cms.total_cost_new,
	cms.total_cost_unit_price,
	cms.total_depreciation_amount,
	cms.total_depreciated_cost
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_cms_estimate as cms with(tablockx) on
	cms.prop_val_yr = cplpl.prop_val_yr and
	cms.sup_num = cplpl.sup_num and
	cms.sale_id = 0 and
	cms.prop_id = cplpl.prop_id
 
 -- Sections
insert imprv_detail_cms_section with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	section_id,
	section_type,
	section_description,
	area,
	stories,
	perimeter_shape_flag,
	perimeter,
	shape,
	effective_year_built,
	effective_year_built_override,
	dep_type,
	dep_pct,
	dep_typical_life,
	dep_physical,
	dep_functional,
	dep_physical_functional,
	dep_external,
	dep_additional_functional,
	dep_override,
	remarks,
	basement_building_section_id,
	calculated_date,
	total_cost_new,
	depreciation_amount,
	depreciated_cost,
	base_cost_total_cost_new,
	base_cost_calc_unit_cost,
	base_cost_depreciation_amount,
	base_cost_depreciated_cost,
	basement_fireproof_flag,
	basement_fireproof_total_cost_new,
	basement_fireproof_calc_unit_cost,
	basement_fireproof_depreciation_amount,
	basement_fireproof_depreciated_cost,
	calc_dep_physical_pct,
	calc_dep_physical_amount,
	calc_dep_functional_pct,
	calc_dep_functional_amount,
	calc_dep_combined_pct,
	calc_dep_combined_amount,
	calc_dep_external_pct,
	calc_dep_external_amount,
	calc_dep_additional_functional_pct,
	calc_dep_additional_functional_amount
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	cms.prop_id,
	cms.imprv_id,
	cms.imprv_det_id,
	cms.section_id,
	cms.section_type,
	cms.section_description,
	cms.area,
	cms.stories,
	cms.perimeter_shape_flag,
	cms.perimeter,
	cms.shape,
	cms.effective_year_built,
	cms.effective_year_built_override,
	cms.dep_type,
	cms.dep_pct,
	cms.dep_typical_life,
	cms.dep_physical,
	cms.dep_functional,
	cms.dep_physical_functional,
	cms.dep_external,
	cms.dep_additional_functional,
	cms.dep_override,
	cms.remarks,
	cms.basement_building_section_id,
	cms.calculated_date,
	cms.total_cost_new,
	cms.depreciation_amount,
	cms.depreciated_cost,
	cms.base_cost_total_cost_new,
	cms.base_cost_calc_unit_cost,
	cms.base_cost_depreciation_amount,
	cms.base_cost_depreciated_cost,
	cms.basement_fireproof_flag,
	cms.basement_fireproof_total_cost_new,
	cms.basement_fireproof_calc_unit_cost,
	cms.basement_fireproof_depreciation_amount,
	cms.basement_fireproof_depreciated_cost,
	cms.calc_dep_physical_pct,
	cms.calc_dep_physical_amount,
	cms.calc_dep_functional_pct,
	cms.calc_dep_functional_amount,
	cms.calc_dep_combined_pct,
	cms.calc_dep_combined_amount,
	cms.calc_dep_external_pct,
	cms.calc_dep_external_amount,
	cms.calc_dep_additional_functional_pct,
	cms.calc_dep_additional_functional_amount
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_cms_section as cms with(tablockx) on
	cms.prop_val_yr = cplpl.prop_val_yr and
	cms.sup_num = cplpl.sup_num and
	cms.sale_id = 0 and
	cms.prop_id = cplpl.prop_id
	
 -- Occupancies
insert imprv_detail_cms_occupancy with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	section_id,
	occupancy_id,
	occupancy_code,
	occupancy_description,
	occupancy_pct,
	class,
	height,
	quality_rank,
	quality_rank_override,
	basement_type,
	basement_type_description,
	basement_area,
	basement_depreciation_pct,
	basement_effective_year_built,
	basement_effective_year_built_override,
	basement_typical_life,
	basement_typical_life_override
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	cms.prop_id,
	cms.imprv_id,
	cms.imprv_det_id,
	cms.section_id,
	cms.occupancy_id,
	cms.occupancy_code,
	cms.occupancy_description,
	cms.occupancy_pct,
	cms.class,
	cms.height,
	cms.quality_rank,
	cms.quality_rank_override,
	cms.basement_type,
	cms.basement_type_description,
	cms.basement_area,
	cms.basement_depreciation_pct,
	cms.basement_effective_year_built,
	cms.basement_effective_year_built_override,
	cms.basement_typical_life,
	cms.basement_typical_life_override
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_cms_occupancy as cms with(tablockx) on
	cms.prop_val_yr = cplpl.prop_val_yr and
	cms.sup_num = cplpl.sup_num and
	cms.sale_id = 0 and
	cms.prop_id = cplpl.prop_id

-- Components
insert imprv_detail_cms_component with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	section_id,
	component_id,
	component_code,
	component_description,
	component_system_code,
	component_system_description,
	component_pct,
	quality_rank,
	quality_rank_override,
	units,
	depreciation_pct,
	num_stops,
	climate,
	total_cost_new,
	calc_unit_cost,
	depreciation_amount,
	depreciated_cost
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	cms.prop_id,
	cms.imprv_id,
	cms.imprv_det_id,
	cms.section_id,
	cms.component_id,
	cms.component_code,
	cms.component_description,
	cms.component_system_code,
	cms.component_system_description,
	cms.component_pct,
	cms.quality_rank,
	cms.quality_rank_override,
	cms.units,
	cms.depreciation_pct,
	cms.num_stops,
	cms.climate,
	cms.total_cost_new,
	cms.calc_unit_cost,
	cms.depreciation_amount,
	cms.depreciated_cost
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_cms_component as cms with(tablockx) on
	cms.prop_val_yr = cplpl.prop_val_yr and
	cms.sup_num = cplpl.sup_num and
	cms.sale_id = 0 and
	cms.prop_id = cplpl.prop_id

-- Additions
insert imprv_detail_cms_addition with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	section_id,
	addition_id,
	addition_system_code,
	addition_system_description,
	addition_description,
	units,
	unit_cost,
	depreciation_pct,
	effective_year_built,
	effective_year_built_override,
	typical_life,
	use_local_multiplier,
	apply_trend,
	base_date,
	total_cost_new,
	calc_unit_cost,
	depreciation_amount,
	depreciated_cost
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	cms.prop_id,
	cms.imprv_id,
	cms.imprv_det_id,
	cms.section_id,
	cms.addition_id,
	cms.addition_system_code,
	cms.addition_system_description,
	cms.addition_description,
	cms.units,
	cms.unit_cost,
	cms.depreciation_pct,
	cms.effective_year_built,
	cms.effective_year_built_override,
	cms.typical_life,
	cms.use_local_multiplier,
	cms.apply_trend,
	cms.base_date,
	cms.total_cost_new,
	cms.calc_unit_cost,
	cms.depreciation_amount,
	cms.depreciated_cost
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_cms_addition as cms with(tablockx) on
	cms.prop_val_yr = cplpl.prop_val_yr and
	cms.sup_num = cplpl.sup_num and
	cms.sale_id = 0 and
	cms.prop_id = cplpl.prop_id

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry, @@ROWCOUNT, @@ERROR

GO

