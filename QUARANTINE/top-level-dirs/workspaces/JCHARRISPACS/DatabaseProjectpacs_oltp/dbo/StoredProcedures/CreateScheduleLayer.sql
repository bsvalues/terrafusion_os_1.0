

CREATE PROCEDURE [dbo].[CreateScheduleLayer] 
	@input_from_yr numeric(4,0),
	@input_to_yr numeric(4,0)

AS
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
declare @proc varchar(500)
set @proc = object_name(@@procid)
 
SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@input_from_yr)
         + ',' + convert(char(4),@input_to_yr) 
 
exec dbo.CurrentActivityLogInsert @proc, @qry

/* End top of each procedure to capture parameters */
/*****************************************************************/
/**************** copy improvement schedules *********************/
/*****************************************************************/

if not exists
(
	select
		*
	from
		pacs_system_year
	where
		pacs_yr = @input_to_yr
)
begin
	insert
		pacs_system_year
	(
		pacs_yr,
		depreciation_yr,
		pp_depreciation_yr
	)
	select
		@input_to_yr,
		depreciation_yr + 1,
		pp_depreciation_yr + 1
	from
		pacs_system_year
	where
		pacs_yr = @input_from_yr
end

-- start of copy tables
exec dbo.CreateFY_NY_SL_imprv_sched @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_imprv_sched_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_imprv_sched_attr @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_imprv_attr_val @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_label @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_operator @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_axis @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_axis_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_imprv_sched_matrix_assoc @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_axis_feature @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_matrix_axis_land_characteristic @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_deprec @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_eif_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_size_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_std_detail @input_from_yr,@input_to_yr,'NYSL'

/*******************************************************************************/
/******************************* copy land schedules ***************************/
/*******************************************************************************/

exec dbo.CreateFY_NY_SL_land_sched @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_sched_matrix_assoc @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_sched_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_sched_si_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_sched_ff_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_sched_soil_detail @input_from_yr,@input_to_yr,'NYSL'
/*******************************************************************************/
/******************************* copy land misc code schedules ***************************/
/*******************************************************************************/

exec dbo.CreateFY_NY_SL_land_misc_code_adj_lookup_config @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_misc_code_adj @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_misc_code_adj_detail @input_from_yr,@input_to_yr,'NYSL'

/**************************************************************/
/***************** copy personal property schedules ***********/
/**************************************************************/

exec dbo.CreateFY_NY_SL_pp_schedule @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_pp_schedule_class @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_pp_schedule_area @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_pp_schedule_adj @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_pp_schedule_deprec @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_quality_density @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_order @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_unit_count @input_from_yr,@input_to_yr,'NYSL'
 
/**************************************************************/
/***************** copy ms multipliers ************************/
/**************************************************************/

exec dbo.CreateFY_NY_SL_ms_comm_cost_mult @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_ms_comm_local_mult @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_ms_manuf_mult @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_ms_mult @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_ms_multi_mult @input_from_yr,@input_to_yr,'NYSL'

/********************************************************/
/*  Codefiles			                   	*/
/********************************************************/

exec dbo.CreateFY_NY_SL_neighborhood @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_abs_subdv @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_township @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_prop_range @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_depreciation @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_depreciation_detail @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_imprv_adj_type @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_adj_type @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_permanent_crop_configuration @input_from_yr,@input_to_yr,'NYSL'

/********************************************************/
/*  Mineral Import                                      */
/********************************************************/

exec dbo.CreateFY_NY_SL_mineral_import_entity_map @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_mineral_import_format @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_mineral_import_options @input_from_yr,@input_to_yr,'NYSL'

/********************************************************/
/*  Next ID's, Misc.		                   	*/
/********************************************************/

insert into
	pacs_year
(
	tax_yr,
	certification_dt,
	notice_dt,
	Prev_reappraised_yr
)
select
	@input_to_yr,
	NULL,
	NULL,
	Prev_reappraised_yr
from
	pacs_year
where
	tax_yr = @input_from_yr
and	not exists
(
	select
		*
	from
		pacs_year as py1
	where
		py1.tax_yr = @input_to_yr
)

if not exists (
	select *
	from supplement
	where
		sup_tax_yr = @input_to_yr and
		sup_num = 0
)
begin
	insert supplement (sup_tax_yr, sup_num, sup_group_id)
	values (@input_to_yr, 0, 0)
end


exec dbo.UpdateNextIDs 1


exec dbo.CreateFY_NY_SL_comp_sales_adj_annual_time @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_adj_cva @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_adj_feature @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_adj_finance @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_adj_location @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_adj_location_config @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_config @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_abstract_subdivision @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_city @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_cva @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_location @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_neighborhood @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_quality @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_region @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_school @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_state_code @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_corp_score_subset @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_abstract_subdivision @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_age @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_bldg_size @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_city @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_cva @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_land_size @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_comp_sales_point_location @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_comp_sales_point_neighborhood @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_comp_sales_point_nra @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_quality @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_region @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_school @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_comp_sales_point_state_code @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_comp_sales_point_subset @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_comp_sales_point_time_sale @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_comp_sales_property_use_life_expectancy @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_imprv_sched_detail_comp @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_imprv_sched_detail_quality_comp @input_from_yr,@input_to_yr,'NYSL' 

exec dbo.CreateFY_NY_SL_income_sched @input_from_yr,@input_to_yr,'NYSL'
exec dbo.CreateFY_NY_SL_income_sched_grm_gim @input_from_yr,@input_to_yr,'NYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_config @input_from_yr,@input_to_yr,'NYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_detail @input_from_yr,@input_to_yr,'NYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_detail_matrix_assoc @input_from_yr,@input_to_yr,'NYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_econ @input_from_yr,@input_to_yr,'NYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_econ_matrix_assoc @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_pp_depreciation_method_maintenance @input_from_yr,@input_to_yr,'NYSL'

-- rgoolsby added calls for insert to tables added for 9.0
exec dbo.CreateFY_NY_SL_special_assessment @input_from_yr,@input_to_yr,'NYSL'

-- gfaraj - copy user values for Special Assessments
exec dbo.CreateFY_NY_SimpleUserDefinedTables @input_from_yr,@input_to_yr,'user_special_assessment','year','NYSL'

exec dbo.CreateFY_NY_SL_special_assessment_statement_options @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_special_assessment_exemption @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_land_sched_current_use @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_condominium @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_condominium_amenity @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_annexation_configuration @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_levy @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_levy_exemption @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_levy_link @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_tif_area_levy @input_from_yr,@input_to_yr,'NYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_tax_district_joint
exec dbo.CreateFY_NY_SL_tax_district_joint @input_from_yr,@input_to_yr,'NYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_levy_statement_option
exec dbo.CreateFY_NY_SL_levy_statement_option @input_from_yr,@input_to_yr,'NYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_levy_limit
exec dbo.CreateFY_NY_SL_levy_limit @input_from_yr,@input_to_yr,'NYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_fund
exec dbo.CreateFY_NY_SL_fund @input_from_yr,@input_to_yr,'NYSL'

-- must call CreateFY_NY_SL_fund proc before CreateFY_NY_SL_tax_area_fund_assoc
exec dbo.CreateFY_NY_SL_tax_area_fund_assoc @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_holiday_year @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_exmpt_qualify_code @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_hof_exemption_setting @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_penalty_and_interest @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_rendition_late_filing_config @input_from_yr,@input_to_yr,'NYSL'

exec dbo.CreateFY_NY_SL_rendition_penalty_config @input_from_yr,@input_to_yr,'NYSL'

-- update activity log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@@Rowcount,@@ERROR

GO

