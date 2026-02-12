
CREATE procedure [dbo].[UndoCreateNewYearLayer]

@input_from_yr	numeric(4)

as

SET NOCOUNT ON

-- Perform the undo in a try-catch block and a transaction, so that errors can be
-- caught and rolled up, even if they occur in sub-procedures.
begin try
begin tran

/* Top of each procedure to capture input parameters */
DECLARE @StartProc datetime
    set @StartProc= getdate()
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@input_from_yr)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */

/* turn off logging */
exec SetMachineLogChanges 0

declare @lPropGridID int
declare @count_comp_grids int
set @count_comp_grids = 0
declare curCompGrids insensitive cursor
for
	select lPropGridID
	from dbo.comp_sales_property_grids with(nolock)
	where lYear = @input_from_yr
for read only

open curCompGrids
fetch next from curCompGrids into @lPropGridID

while (@@fetch_status = 0)
begin
	exec dbo.CompSalesRemovePropGrid @lPropGridID
	set @count_comp_grids = @count_comp_grids + 1
	fetch next from curCompGrids into @lPropGridID
end

close curCompGrids
deallocate curCompGrids

  exec dbo.CurrentActivityLogInsert @proc,'end delete comp grids',@count_comp_grids,@@ERROR

delete dbo._arb_rpt_inquiry_report where prop_val_yr = @input_from_yr
delete dbo._arb_inquiry_listing where prop_val_yr = @input_from_yr
delete dbo._arb_inquiry_link_assoc where prop_val_yr = @input_from_yr
delete dbo._arb_inquiry where prop_val_yr = @input_from_yr

delete dbo._arb_rpt_protest_report where prop_val_yr = @input_from_yr
delete dbo._arb_protest_listing where prop_val_yr = @input_from_yr
delete dbo._arb_rpt_multi_protest_listing where prop_val_yr = @input_from_yr
delete dbo._arb_rpt_panel_decisions where prop_val_yr = @input_from_yr
delete dbo._arb_rpt_protest_sign_in_list where prop_val_yr = @input_from_yr
delete dbo.arbitration_case_assoc where prop_val_yr = @input_from_yr
delete dbo._arb_protest_panel_member where prop_val_yr = @input_from_yr
delete dbo._arb_protest_protest_by_assoc where prop_val_yr = @input_from_yr
delete dbo._arb_protest_reason where prop_val_yr = @input_from_yr
delete dbo._arb_protest where prop_val_yr = @input_from_yr

  exec dbo.CurrentActivityLogInsert @proc,'end delete protests and inquiries',0,@@ERROR

delete dbo.penalty_and_interest where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete penalty_and_interest',@count_comp_grids,@@ERROR

delete from pp_rendition_tracking where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_rendition_tracking',@@Rowcount,@@ERROR

delete from income_prop_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete income_prop_assoc',@@Rowcount,@@ERROR
delete from income where income_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete income',@@Rowcount,@@ERROR

delete from shared_prop_value where shared_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete shared_prop_value',@@Rowcount,@@ERROR
delete from shared_prop where shared_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete shared_prop',@@Rowcount,@@ERROR

delete from agent_assoc where owner_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete agent_assoc',@@Rowcount,@@ERROR

delete from pers_prop_exemption_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pers_prop_exemption_assoc',@@Rowcount,@@ERROR
delete from pers_prop_owner_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pers_prop_owner_assoc',@@Rowcount,@@ERROR
delete from pers_prop_entity_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pers_prop_entity_assoc',@@Rowcount,@@ERROR
delete from pp_seg_sched_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_seg_sched_assoc',@@Rowcount,@@ERROR
delete from pers_prop_sub_seg where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pers_prop_sub_seg',@@Rowcount,@@ERROR
delete from pers_prop_seg where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pers_prop_seg',@@Rowcount,@@ERROR

delete from land_exemption_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_exemption_assoc',@@Rowcount,@@ERROR
delete from land_owner_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_owner_assoc',@@Rowcount,@@ERROR
delete from land_entity_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_entity_assoc',@@Rowcount,@@ERROR
delete from land_adj where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_adj',@@Rowcount,@@ERROR
delete from land_detail where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_detail',@@Rowcount,@@ERROR

delete from imprv_detail_cms_addition where prop_val_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_detail_cms_addition',@@Rowcount,@@ERROR
delete from imprv_detail_cms_component where prop_val_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_detail_cms_component',@@Rowcount,@@ERROR
delete from imprv_detail_cms_occupancy where prop_val_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_detail_cms_occupancy',@@Rowcount,@@ERROR
	delete from imprv_detail_cms_section where prop_val_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_detail_cms_section',@@Rowcount,@@ERROR
delete from imprv_detail_cms_estimate where prop_val_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_detail_cms_estimate',@@Rowcount,@@ERROR
	
delete from imprv_remodel where year = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_remodel',@@Rowcount,@@ERROR
delete from imprv_exemption_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_exemption_assoc',@@Rowcount,@@ERROR
delete from imprv_owner_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_owner_assoc',@@Rowcount,@@ERROR
delete from imprv_entity_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_entity_assoc',@@Rowcount,@@ERROR
delete from imprv_sketch where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_sketch',@@Rowcount,@@ERROR

-- pacs_image
declare @location varchar(255)
declare @cmd varchar(4000)

declare imprv_images cursor fast_forward for
select location from pacs_image
where ref_type in ('SKTCH', 'PI')
and ref_year = @input_from_yr

open imprv_images
fetch next from imprv_images into @location

while @@fetch_status = 0
begin
	set @cmd = 'del "' + @location + '"'
	exec xp_cmdshell @cmd, no_output
	fetch next from imprv_images into @location
end

close imprv_images
deallocate imprv_images

delete pacs_image
where ref_type in ('SKTCH', 'PI')
and ref_year = @input_from_yr

delete from imprv_sketch_note where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_sketch_note',@@Rowcount,@@ERROR
delete from imprv_attr where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_attr',@@Rowcount,@@ERROR
delete from imprv_det_adj where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_det_adj',@@Rowcount,@@ERROR
delete from imprv_adj where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_adj',@@Rowcount,@@ERROR
delete from imprv_detail where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_detail',@@Rowcount,@@ERROR
delete from imprv where prop_val_yr = @input_from_yr	
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv',@@Rowcount,@@ERROR

delete from prop_supp_assoc where owner_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete prop_supp_assoc',@@Rowcount,@@ERROR

delete from prop_linked_owner where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete prop_linked_owner',@@Rowcount,@@ERROR

delete from owner where owner_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete owner',@@Rowcount,@@ERROR

delete from property_special_entity_exemption where owner_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_special_entity_exemption',@@Rowcount,@@ERROR
delete from property_freeze where owner_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_freeze',@@Rowcount,@@ERROR
delete from property_exemption_income where owner_tax_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete property_exemption_income',@@Rowcount,@@ERROR
delete from property_exemption_dor_detail where owner_tax_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete property_exemption_dor_detail',@@Rowcount,@@ERROR
delete from property_exemption where owner_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_exemption',@@Rowcount,@@ERROR

delete from entity_prop_assoc where tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete entity_prop_assoc',@@Rowcount,@@ERROR
delete from rendition where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete rendition',@@Rowcount,@@ERROR


-- Property Layer added for 9.0 -- need to delete prior to deleting property_val
delete from property_sketch where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_sketch',@@Rowcount,@@ERROR
delete from property_assessment_attribute_val where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_assessment_attribute_val',@@Rowcount,@@ERROR
delete from property_special_assessment where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_special_assessment',@@Rowcount,@@ERROR
delete from property_land_misc_code where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_land_misc_code',@@Rowcount,@@ERROR
delete from property_income_characteristic_tenant where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_income_characteristic_tenant',@@Rowcount,@@ERROR
delete from property_income_characteristic_amount where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_income_characteristic_amount',@@Rowcount,@@ERROR
delete from property_income_characteristic_unit_mix where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_income_characteristic_unit_mix',@@Rowcount,@@ERROR
delete from property_income_characteristic where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_income_characteristic',@@Rowcount,@@ERROR
delete from land_detail_characteristic where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_detail_characteristic',@@Rowcount,@@ERROR
delete from property_legal_description where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_legal_description',@@Rowcount,@@ERROR
delete from user_owner where owner_tax_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete user_owner',@@Rowcount,@@ERROR
delete from user_property_val where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete user_property_val',@@Rowcount,@@ERROR
delete from user_land_detail where prop_val_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete user_land_detail',@@Rowcount,@@ERROR
delete from user_property_special_assessment where [year] = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete user_property_special_assessment',@@Rowcount,@@ERROR
delete from user_special_assessment where [year] = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete user_special_assessment',@@Rowcount,@@ERROR
delete from property_tax_area where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_tax_area',@@Rowcount,@@ERROR
delete from pp_review where year = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete pp_review',@@Rowcount,@@ERROR
delete from property_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_assoc',@@Rowcount,@@ERROR

delete from prop_characteristic_assoc where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete prop_characteristic_assoc',@@Rowcount,@@ERROR

delete from property_profile where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_profile',@@Rowcount,@@ERROR

delete from property_current_use_review where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_current_use_review',@@Rowcount,@@ERROR
delete from property_current_use_removal where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete proprety_current_use_removal',@@Rowcount,@@ERROR

delete from tif_area_levy where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete tif_area_levy',@@Rowcount,@@ERROR
delete from tif_area_prop_assoc where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete tif_area_prop_assoc',@@Rowcount,@@ERROR

-- Now delete the state specific property_val table
declare @szRegion varchar(2)
select @szRegion = szConfigValue
from core_config with(nolock)
where szGroup = 'SYSTEM' and szConfigName = 'REGION'

declare @szSQL varchar(8000)
set @szSQL = 'exec ' + @szRegion + 'UndoNewYearLayerTablePV ' +
            convert(varchar(12), @input_from_yr) + ',' +
            'UndoCreateNewYearLayer'

exec(@szSQL)

--- end new for 9.0
delete from property_current_use_review where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_current_use_review',@@Rowcount,@@ERROR
  
delete from property_val where prop_val_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete property_val',@@Rowcount,@@ERROR

delete from mineral_import_options where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete mineral_import_options',@@Rowcount,@@ERROR
delete from mineral_import_format where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete mineral_import_format',@@Rowcount,@@ERROR
delete from mineral_import_entity_map where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete mineral_import_entity_map',@@Rowcount,@@ERROR

delete from ms_multi_mult where ms_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete ms_multi_mult',@@Rowcount,@@ERROR
delete from ms_mult where ms_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete ms_mult',@@Rowcount,@@ERROR
delete from ms_manuf_mult where ms_year =  @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete ms_manuf_mult',@@Rowcount,@@ERROR
delete from ms_comm_local_mult where ms_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete ms_comm_local_mult',@@Rowcount,@@ERROR
delete from ms_comm_cost_mult where ms_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete ms_comm_cost_mult',@@Rowcount,@@ERROR

delete from pp_schedule_unit_count where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_unit_count',@@Rowcount,@@ERROR
delete from pp_schedule_order where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_order',@@Rowcount,@@ERROR
delete from pp_schedule_quality_density where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_quality_density',@@Rowcount,@@ERROR
delete from pp_schedule_deprec where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_deprec',@@Rowcount,@@ERROR
delete from pp_schedule_adj where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_adj',@@Rowcount,@@ERROR
delete from pp_schedule_area where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_area',@@Rowcount,@@ERROR
delete from pp_schedule_class where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule_class',@@Rowcount,@@ERROR
delete from pp_schedule where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pp_schedule',@@Rowcount,@@ERROR

delete from land_sched_soil_detail where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched_soil_detail',@@Rowcount,@@ERROR
delete from land_sched_ff_detail where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched_ff_detail',@@Rowcount,@@ERROR
delete from land_sched_si_detail where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched_si_detail',@@Rowcount,@@ERROR
delete from land_sched_detail where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched_detail',@@Rowcount,@@ERROR
delete from land_sched_matrix_assoc where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched_matrix_assoc',@@Rowcount,@@ERROR
delete from land_sched where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched',@@Rowcount,@@ERROR

delete from land_misc_code_adj_detail where [year] = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_misc_code_adj_detail',@@Rowcount,@@ERROR
delete from land_misc_code_adj where [year] = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_misc_code_adj',@@Rowcount,@@ERROR
delete from land_misc_code_adj_lookup_config where [year] = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_misc_code_adj_lookup_config',@@Rowcount,@@ERROR

delete from slope_intercept_std_detail where sid_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete slope_intercept_std_detail',@@Rowcount,@@ERROR
delete from slope_intercept_size_detail where sid_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete slope_intercept_size_detail',@@Rowcount,@@ERROR
delete from slope_intercept_eif_detail where sid_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete slope_intercept_eif_detail',@@Rowcount,@@ERROR
delete from slope_intercept_deprec where sid_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete slope_intercept_deprec',@@Rowcount,@@ERROR

delete from matrix_axis_land_characteristic where matrix_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_axis_land_characteristic',@@Rowcount,@@ERROR
delete from matrix_axis_feature where lYear = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_axis_feature',@@Rowcount,@@ERROR

delete from income_sched_imprv_detail_matrix_assoc where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched_imprv_detail_matrix_assoc',@@Rowcount,@@ERROR
delete from income_sched_imprv_econ_matrix_assoc where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched_imprv_econ_matrix_assoc',@@Rowcount,@@ERROR
delete from imprv_sched_matrix_assoc where imprv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_sched_matrix_assoc',@@Rowcount,@@ERROR
delete from matrix_axis_detail where matrix_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_axis_detail',@@Rowcount,@@ERROR
delete from matrix_detail where matrix_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_detail',@@Rowcount,@@ERROR
delete from matrix where matrix_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix',@@Rowcount,@@ERROR
delete from matrix_axis where matrix_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_axis',@@Rowcount,@@ERROR
delete from matrix_operator where matrix_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_operator',@@Rowcount,@@ERROR
delete from matrix_label where matrix_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete matrix_label',@@Rowcount,@@ERROR

delete from imprv_attr_val where imprv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_attr_val',@@Rowcount,@@ERROR
delete from imprv_sched_attr where imprv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_sched_attr',@@Rowcount,@@ERROR
delete from imprv_sched_detail where imprv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_sched_detail',@@Rowcount,@@ERROR
delete from imprv_sched where imprv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete imprv_sched',@@Rowcount,@@ERROR

delete from entity_exmpt where exmpt_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete entity_exmpt',@@Rowcount,@@ERROR
delete from tax_rate where tax_rate_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete tax_rate',@@Rowcount,@@ERROR

delete from lease_prop_assoc where lease_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete lease_prop_assoc',@@Rowcount,@@ERROR
delete from lease_entity_assoc where lease_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete lease_entity_assoc',@@Rowcount,@@ERROR
delete from lease where lease_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete lease',@@Rowcount,@@ERROR

delete from master_lease_prop_assoc where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete master_lease_prop_assoc',@@Rowcount,@@ERROR
delete from master_lease where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete master_lease',@@Rowcount,@@ERROR

-- following added for 9.0
-- Schedule Layer
delete from permanent_crop_configuration where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete permanent_crop_configuration',@@rowcount,@@ERROR
delete from special_assessment_statement_options where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete special_assessment_statement_options',@@Rowcount,@@ERROR
delete from special_assessment_exemption where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete special_assessment_exemption',@@Rowcount,@@ERROR
delete from special_assessment where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete special_assessment',@@Rowcount,@@ERROR
delete from land_sched_current_use where ls_year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete land_sched_current_use',@@Rowcount,@@ERROR
delete from condominium_amenity where abs_subdv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete condominium_amenity',@@Rowcount,@@ERROR
delete from condominium where abs_subdv_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete condominium',@@Rowcount,@@ERROR
delete from levy_statement_option where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete levy_statement_option',@@Rowcount,@@ERROR
delete from levy_limit where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete levy_limit',@@Rowcount,@@ERROR
delete from income_sched_imprv_detail where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched_imprv_detail',@@Rowcount,@@ERROR
delete from income_sched_imprv_econ where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched_imprv_econ',@@Rowcount,@@ERROR
delete from income_sched_imprv_config where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched_imprv_config',@@Rowcount,@@ERROR
delete from income_sched_grm_gim where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched_grm_gim',@@Rowcount,@@ERROR
delete from income_sched where income_yr = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete income_sched',@@Rowcount,@@ERROR

delete from levy_exemption where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete levy_exemption',@@Rowcount,@@ERROR

delete from levy_link where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete levy_link',@@Rowcount,@@ERROR

delete from tax_area_fund_assoc where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete tax_area_fund_assoc',@@Rowcount,@@ERROR
delete from tax_district_joint where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete tax_district_joint',@@Rowcount,@@ERROR
delete from fund where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete fund',@@Rowcount,@@ERROR
delete from levy where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete levy',@@Rowcount,@@ERROR
delete from annexation_configuration where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete annexation_configuration',@@Rowcount,@@ERROR
delete from holiday_schedule where YEAR(holiday_date) = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete holiday_schedule',@@Rowcount,@@ERROR
delete from holiday_year where holiday_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete holiday_year',@@Rowcount,@@ERROR

delete from exmpt_qualify_code where year = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete exmpt_qualify_code',@@Rowcount,@@ERROR

delete from dor_report_config_stratum where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete dor_report_config_stratum',@@Rowcount,@@ERROR
delete from dor_report_config where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete_dor_report_config',@@Rowcount,@@ERROR
	
delete from pacs_year where tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pacs_year',@@Rowcount,@@ERROR
delete from supplement where sup_tax_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete supplement',@@Rowcount,@@ERROR
delete from pacs_system_year where pacs_yr = @input_from_yr
  exec dbo.CurrentActivityLogInsert @proc,'end delete pacs_system_year',@@Rowcount,@@ERROR
delete from pacs_config_year where [year] = @input_from_yr
	exec dbo.CurrentActivityLogInsert @proc,'end delete pacs_config_year',@@Rowcount,@@ERROR

declare @yearTo numeric(4,0)
select @yearTo = max(tax_yr) from pacs_year with(nolock)

update pacs_system
set appr_yr = @yearTo
  exec dbo.CurrentActivityLogInsert @proc,'end restore pacs_system.appr_yr',@@Rowcount, @@ERROR
  
/* turn on logging */
exec SetMachineLogChanges 1

-- update log
set @qry = Replace(@qry,'Start','End')
           + ' Proc Total Duration in minutes: ' + convert(varchar(30),datediff(mi,@StartProc,getdate()))

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR


-- If an error is caught, roll back the transaction.
-- Then, raise the error again so it will appear in the PACS client.
commit tran
end try

begin catch
	if @@trancount > 0 rollback tran;

	declare @ErrorMessage nvarchar(max);
	declare @ErrorSeverity int;
	declare @ErrorState int;

	select @ErrorMessage = error_message(),
		@ErrorSeverity = error_severity(),
		@ErrorState = error_state()

	raiserror(@ErrorMessage, @ErrorSeverity, @ErrorState)
end catch

GO

