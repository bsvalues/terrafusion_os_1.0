
create procedure RecalcDeleteBCPTables

as

set nocount on

	truncate table #recalc_bcp_property_val
	truncate table #recalc_bcp_property_val_personal
	truncate table #recalc_bcp_property_val_mineral
	truncate table #recalc_bcp_land_detail
	truncate table #recalc_bcp_imprv_detail
	truncate table #recalc_bcp_imprv_det_adj
	truncate table #recalc_bcp_imprv
	truncate table #recalc_bcp_imprv_attr
	truncate table #recalc_bcp_pers_prop_seg
	truncate table #recalc_bcp_pers_prop_sub_seg
	truncate table #recalc_bcp_pp_seg_sched_assoc
	truncate table #recalc_bcp_income
	truncate table #recalc_bcp_income_prop_assoc
	truncate table #recalc_bcp_property_profile
	truncate table #recalc_bcp_market_value_change
	truncate table #recalc_bcp_shared_prop

	truncate table #recalc_bcp_entity_prop_assoc
	truncate table #recalc_bcp_property_special_entity_exemption
	truncate table #recalc_bcp_imprv_exemption_assoc
	truncate table #recalc_bcp_land_exemption_assoc
	truncate table #recalc_bcp_pers_prop_exemption_assoc
	truncate table #recalc_bcp_owner

	truncate table #recalc_bcp_chg_of_owner_prop_assoc
	truncate table #recalc_bcp_property_land_misc_code
	
	truncate table #recalc_bcp_imprv_detail_cms_estimate
	truncate table #recalc_bcp_imprv_detail_cms_section
	truncate table #recalc_bcp_imprv_detail_cms_component
	truncate table #recalc_bcp_imprv_detail_cms_addition

	truncate table #recalc_bcp_imprv_detail_rms_estimate
	truncate table #recalc_bcp_imprv_detail_rms_section
	truncate table #recalc_bcp_imprv_detail_rms_component
	truncate table #recalc_bcp_imprv_detail_rms_addition
	
	truncate table #recalc_bcp_income_imprv_assoc
	truncate table #recalc_bcp_income_land_detail_assoc
	truncate table #recalc_bcp_income_improvement_level_detail
	truncate table #recalc_bcp_income_grm_gim

GO

