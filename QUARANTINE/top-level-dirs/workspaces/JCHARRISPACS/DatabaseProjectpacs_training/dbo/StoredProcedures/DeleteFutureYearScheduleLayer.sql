
CREATE procedure DeleteFutureYearScheduleLayer

AS

DECLARE	@lFutureYear	numeric(4,0)
SET	@lFutureYear = 0	-- future year is always zero

delete pp_depreciation_method_maintenance where prop_val_yr = @lFutureYear

delete income_sched_imprv_econ_matrix_assoc where [year] = @lFutureYear
delete income_sched_imprv_econ where [year] = @lFutureYear
delete income_sched_imprv_config where [year] = @lFutureYear
delete income_sched where income_yr = @lFutureYear
delete income_sched_grm_gim where [year] = @lFutureYear

delete pacs_rounding_factor where prop_val_yr = @lFutureYear

delete matrix_axis_land_characteristic where matrix_yr = @lFutureYear
delete matrix_axis_feature where lYear = @lFutureYear

delete land_sched_matrix_assoc where ls_year = @lFutureYear
delete imprv_sched_matrix_assoc where imprv_yr = @lFutureYear
delete income_sched_imprv_detail_matrix_assoc where [year] = @lFutureYear

delete income_sched_imprv_detail where [year] = @lFutureYear

delete matrix_detail where matrix_yr = @lFutureYear
delete matrix_axis_detail where matrix_yr = @lFutureYear
delete matrix_detail where matrix_yr = @lFutureYear
delete matrix where matrix_yr = @lFutureYear
delete matrix_axis where matrix_yr = @lFutureYear
delete matrix_operator where matrix_yr = @lFutureYear
delete matrix_label where matrix_yr = @lFutureYear

delete mineral_import_options where year = @lFutureYear
delete mineral_import_format where year = @lFutureYear
delete mineral_import_entity_map where year = @lFutureYear

delete land_adj_type where land_adj_type_year = @lFutureYear
delete imprv_adj_type where imprv_adj_type_year = @lFutureYear

delete depreciation_detail where year = @lFutureYear
delete depreciation where year = @lFutureYear

delete prop_range where range_year = @lFutureYear
delete township where township_year = @lFutureYear
delete condominium where abs_subdv_yr = @lFutureYear
delete abs_subdv where abs_subdv_yr = @lFutureYear
delete neighborhood where hood_yr = @lFutureYear

delete ms_multi_mult where ms_year = @lFutureYear
delete ms_mult where ms_year = @lFutureYear
delete ms_manuf_mult where ms_year = @lFutureYear
delete ms_comm_local_mult where ms_year = @lFutureYear
delete ms_comm_cost_mult where ms_year = @lFutureYear

delete pp_schedule_unit_count where year = @lFutureYear
delete pp_schedule_order where year = @lFutureYear
delete pp_schedule_quality_density where year = @lFutureYear
delete pp_schedule_deprec where year = @lFutureYear
delete pp_schedule_adj where year = @lFutureYear
delete pp_schedule_area where year = @lFutureYear
delete pp_schedule_class where year = @lFutureYear
delete pp_schedule where year = @lFutureYear

delete land_misc_code_adj_detail where year = @lFutureYear
delete land_misc_code_adj where year = @lFutureYear
delete land_misc_code_adj_lookup_config where year = @lFutureYear

delete land_sched_soil_detail where ls_year = @lFutureYear
delete land_sched_ff_detail where ls_year = @lFutureYear
delete land_sched_si_detail where ls_year = @lFutureYear
delete land_sched_detail where ls_year = @lFutureYear
delete land_sched where ls_year = @lFutureYear

delete slope_intercept_std_detail where sid_year = @lFutureYear
delete slope_intercept_size_detail where sid_year = @lFutureYear
delete slope_intercept_eif_detail where sid_year = @lFutureYear
delete slope_intercept_deprec where sid_year = @lFutureYear

delete imprv_attr_val where imprv_yr = @lFutureYear
delete imprv_sched_attr where imprv_yr = @lFutureYear
delete imprv_sched_detail where imprv_yr = @lFutureYear
delete imprv_sched where imprv_yr = @lFutureYear

delete special_assessment where year = @lFutureYear
delete special_assessment_statement_options where year = @lFutureYear
delete special_assessment_exemption where year = @lFutureYear

delete land_sched_current_use where ls_year = @lFutureYear
delete condominium_amenity where abs_subdv_yr = @lFutureYear
delete annexation_configuration where year = @lFutureYear

delete from tif_area_levy where year = @lFutureYear
delete from levy_link where year = @lFutureYear
delete from levy_exemption where year = @lFutureYear
delete from tax_district_joint where year = @lFutureYear
delete from levy_statement_option where year = @lFutureYear
delete from levy_limit where year = @lFutureYear
delete from tax_area_fund_assoc where year = @lFutureYear
delete from fund where year = @lFutureYear
delete from levy where year = @lFutureYear

delete from exmpt_qualify_code where year = @lFutureYear
delete from rendition_penalty_config where year = @lFutureYear
delete from rendition_late_filing_config where year = @lFutureYear

delete permanent_crop_configuration where [year] = @lFutureYear

GO

