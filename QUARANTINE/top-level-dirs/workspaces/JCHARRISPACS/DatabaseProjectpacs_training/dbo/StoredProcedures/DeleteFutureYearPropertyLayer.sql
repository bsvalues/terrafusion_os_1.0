
CREATE PROCEDURE DeleteFutureYearPropertyLayer

AS


delete from property_profile where prop_val_yr = 0

delete from pp_rendition_tracking where prop_val_yr = 0

delete from property_income_characteristic_unit_mix where year = 0
delete from property_income_characteristic_tenant where year = 0
delete from property_income_characteristic_amount where year = 0
delete from property_income_characteristic where year = 0

delete from income_prop_assoc where prop_val_yr = 0
delete from income where income_yr = 0

delete from shared_prop_value where shared_year = 0
delete from shared_prop where shared_year = 0

delete from agent_assoc where owner_tax_yr = 0

delete from pers_prop_exemption_assoc where prop_val_yr = 0
delete from pers_prop_owner_assoc where prop_val_yr = 0
delete from pers_prop_entity_assoc where prop_val_yr = 0
delete from pers_prop_sub_seg where prop_val_yr = 0
delete from pp_seg_sched_assoc where prop_val_yr = 0 
delete from pers_prop_seg where prop_val_yr = 0

delete from land_detail_characteristic where prop_val_yr = 0
delete from user_land_detail where prop_val_yr = 0
delete from land_exemption_assoc where prop_val_yr = 0
delete from land_owner_assoc where prop_val_yr = 0
delete from land_entity_assoc where prop_val_yr = 0
delete from land_adj where prop_val_yr = 0
delete from land_detail where prop_val_yr = 0

delete from imprv_remodel where year = 0
delete from imprv_detail_cms_addition where prop_val_yr = 0
delete from imprv_detail_cms_component where prop_val_yr = 0
delete from imprv_detail_cms_occupancy where prop_val_yr = 0
delete from imprv_detail_cms_section where prop_val_yr = 0
delete from imprv_detail_cms_estimate where prop_val_yr = 0
delete from imprv_sketch_note where prop_val_yr = 0
delete from imprv_sketch where prop_val_yr = 0
delete from imprv_exemption_assoc where prop_val_yr = 0
delete from imprv_owner_assoc where prop_val_yr = 0
delete from imprv_entity_assoc where prop_val_yr = 0
delete from imprv_attr where prop_val_yr = 0
delete from imprv_det_adj where prop_val_yr = 0
delete from imprv_adj where prop_val_yr = 0
delete from imprv_detail where prop_val_yr = 0
delete from imprv where prop_val_yr = 0

delete from user_owner where owner_tax_yr = 0
delete from owner where owner_tax_yr = 0

delete from property_special_entity_exemption where owner_tax_yr = 0
delete from property_freeze where owner_tax_yr = 0
delete from property_exemption where owner_tax_yr = 0

delete from entity_prop_assoc where tax_yr = 0

delete from rendition where prop_val_yr = 0

delete from property_assoc where prop_val_yr = 0
delete from prop_characteristic_assoc where prop_val_yr = 0

delete from property_special_assessment where year = 0
delete from property_assessment_attribute_val where prop_val_yr = 0

delete from property_tax_area where year = 0
delete from annexation_property_assoc where year = 0

delete from property_current_use_review where year = 0
delete from property_current_use_removal where year = 0

-- BEGIN - Delete the state specific property_val table
declare @szRegion varchar(2)
select @szRegion = szConfigValue
from core_config with(nolock)
where szGroup = 'SYSTEM' and szConfigName = 'REGION'

declare @szSQL varchar(8000)
set @szSQL = 'exec ' + @szRegion + 'DeleteFutureYearTablePV'
exec(@szSQL)	
-- END - Delete the state specific property_val table

delete from property_legal_description where prop_val_yr = 0
delete from user_property_val where prop_val_yr = 0
delete from property_val where prop_val_yr = 0
delete from prop_supp_assoc where owner_tax_yr = 0

delete from lease_prop_assoc where lease_yr = 0
delete from lease_entity_assoc where lease_yr = 0
delete from lease where lease_yr = 0

GO

