
CREATE   PROCEDURE [dbo].[CreateFutureYearScheduleLayer]
	@lInputFromYear numeric(4,0)

AS

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
declare @proc varchar(500)
set @proc = object_name(@@procid)
SET @qry = 'Start - ' + @proc + '@lInputFromYear=' + convert(char(4),@lInputFromYear)
 
exec dbo.CurrentActivityLogInsert @proc, @qry

/* End top of each procedure to capture parameters */



DECLARE	@lFutureYear numeric(4,0)
SET	@lFutureYear = 0	-- future year is always zero

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
		pacs_yr = @lFutureYear
)
begin
	insert into
		pacs_system_year
	(
		pacs_yr,
		depreciation_yr,
		pp_depreciation_yr
	)
	select
		@lFutureYear,
		depreciation_yr + 1,
		pp_depreciation_yr + 1
	from
		pacs_system_year
	where
		pacs_yr = @lInputFromYear
end

-- start of copy tables
exec dbo.CreateFY_NY_SL_imprv_sched @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_imprv_sched_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_imprv_sched_attr @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_imprv_attr_val @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_deprec @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_eif_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_size_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_slope_intercept_std_detail @lInputFromYear,@lFutureYear,'FYSL'

/*******************************************************************************/
/******************************* copy land schedules ***************************/
/*******************************************************************************/

exec dbo.CreateFY_NY_SL_land_sched @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_sched_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_sched_si_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_sched_ff_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_sched_soil_detail @lInputFromYear,@lFutureYear,'FYSL'

/*******************************************************************************/
/******************************* copy land misc code schedules ***************************/
/*******************************************************************************/

exec dbo.CreateFY_NY_SL_land_misc_code_adj_lookup_config @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_misc_code_adj @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_misc_code_adj_detail @lInputFromYear,@lFutureYear,'FYSL'

/**************************************************************/
/***************** copy personal property schedules ***********/
/**************************************************************/

exec dbo.CreateFY_NY_SL_pp_schedule @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_class @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_area @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_adj @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_deprec @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_quality_density @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_order @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_schedule_unit_count @lInputFromYear,@lFutureYear,'FYSL'
 
/**************************************************************/
/***************** copy ms multipliers ************************/
/**************************************************************/

exec dbo.CreateFY_NY_SL_ms_comm_cost_mult @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_ms_comm_local_mult @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_ms_manuf_mult @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_ms_mult @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_ms_multi_mult @lInputFromYear,@lFutureYear,'FYSL'

/********************************************************/
/*  Codefiles			                   	*/
/********************************************************/

exec dbo.CreateFY_NY_SL_neighborhood @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_abs_subdv @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_township @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_prop_range @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_depreciation @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_depreciation_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_imprv_adj_type @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_adj_type @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_permanent_crop_configuration @lInputFromYear, @lFutureYear, 'FYSL'

/********************************************************/
/*  Mineral Import                                      */
/********************************************************/

exec dbo.CreateFY_NY_SL_mineral_import_entity_map @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_mineral_import_format @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_mineral_import_options @lInputFromYear,@lFutureYear,'FYSL'

-- these are in differen order in other proc
exec dbo.CreateFY_NY_SL_matrix_label @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix_operator @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix_axis @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix_axis_detail @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_imprv_sched_matrix_assoc @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_sched_matrix_assoc @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix_axis_feature @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_matrix_axis_land_characteristic @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pacs_rounding_factor @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_income_sched @lInputFromYear,@lFutureYear,'FYSL'
exec dbo.CreateFY_NY_SL_income_sched_grm_gim @lInputFromYear,@lFutureYear,'FYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_config @lInputFromYear,@lFutureYear,'FYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_detail @lInputFromYear,@lFutureYear,'FYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_detail_matrix_assoc @lInputFromYear,@lFutureYear,'FYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_econ @lInputFromYear,@lFutureYear,'FYSL'
exec dbo.CreateFY_NY_SL_income_sched_imprv_econ_matrix_assoc @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_pp_depreciation_method_maintenance @lInputFromYear,@lFutureYear,'FYSL'

-- rgoolsby added calls for insert to tables added for 9.0
exec dbo.CreateFY_NY_SL_special_assessment @lInputFromYear,@lFutureYear,'FYSL'

-- gfaraj - copy user values for Special Assessments
exec dbo.CreateFY_NY_SimpleUserDefinedTables @lInputFromYear,@lFutureYear,'user_special_assessment','year','FYSL'

exec dbo.CreateFY_NY_SL_special_assessment_statement_options @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_special_assessment_exemption @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_land_sched_current_use @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_condominium @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_condominium_amenity @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_annexation_configuration @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_levy @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_levy_exemption @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_levy_link @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_tif_area_levy @lInputFromYear,@lFutureYear,'FYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_tax_district_joint
exec dbo.CreateFY_NY_SL_tax_district_joint @lInputFromYear,@lFutureYear,'FYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_levy_statement_option
exec dbo.CreateFY_NY_SL_levy_statement_option @lInputFromYear,@lFutureYear,'FYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_levy_limit
exec dbo.CreateFY_NY_SL_levy_limit @lInputFromYear,@lFutureYear,'FYSL'

-- must call CreateFY_NY_SL_levy proc before CreateFY_NY_SL_fund
exec dbo.CreateFY_NY_SL_fund @lInputFromYear,@lFutureYear,'FYSL'

-- must call CreateFY_NY_SL_fund proc before CreateFY_NY_SL_tax_area_fund_assoc
exec dbo.CreateFY_NY_SL_tax_area_fund_assoc @lInputFromYear,@lFutureYear,'FYSL'

-- rgoolsby- jon said to not copy holiday for future year
--exec dbo.CreateFY_NY_SL_holiday_year @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_exmpt_qualify_code @lInputFromYear,@lFutureYear,'FYSL'

exec dbo.CreateFY_NY_SL_rendition_late_filing_config @lInputFromYear,@lFutureYear,'NYSL'

exec dbo.CreateFY_NY_SL_rendition_penalty_config @lInputFromYear,@lFutureYear,'NYSL'

/********************************************************/
/*  Next ID's, Misc.		                   	*/
/********************************************************/
exec dbo.UpdateNextIDs 1

-- update activity log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@@Rowcount,@@ERROR

GO

