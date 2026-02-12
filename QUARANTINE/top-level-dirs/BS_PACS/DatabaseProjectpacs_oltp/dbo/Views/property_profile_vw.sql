
CREATE VIEW property_profile_vw
AS
SELECT
property_profile.prop_id, school_entity.entity_cd AS school_entity_cd, city_entity.entity_cd AS city_entity_cd,
sl_school_entity.entity_cd AS sl_school_entity_cd, sl_city_entity.entity_cd AS sl_city_entity_cd, property_profile.prop_val_yr,
property_profile.sup_num, property_profile.update_dt, property_profile.state_cd, property_profile.class_cd,
property_profile.land_type_cd, property_profile.yr_blt, property_profile.living_area, property_profile.imprv_unit_price,
property_profile.land_sqft, property_profile.land_acres, property_profile.land_front_feet, property_profile.land_depth,
property_profile.land_unit_price, property_profile.region, property_profile.abs_subdv, property_profile.neighborhood,
property_profile.subset, property_profile.map_id, property_profile.appraised_val, sale.sl_state_cd, sale.sl_class_cd,
sale.sl_land_type_cd, sale.sl_price, sale.sl_ratio, sale.sl_dt, sale.sl_type_cd, sale.sl_ratio_type_cd,
sale.sl_financing_cd, sale.sl_adj_cd, sale.sl_yr_blt, sale.sl_living_area, sale.sl_imprv_unit_price, sale.sl_land_sqft,
sale.sl_land_acres, sale.sl_land_front_feet, sale.sl_land_depth, sale.sl_land_unit_price, account.file_as_name,
situs.primary_situs, situs.situs_num, situs.situs_street_prefx, situs.situs_street,
situs.situs_street_sufix, situs.situs_unit, situs.situs_city, situs.situs_state,
situs.situs_zip, situs.situs_display, owner.hs_prop, account.acct_id,
property_profile.imprv_add_val, property_profile.land_lot, property_profile.school_id, property_val.market,
property_profile.condition_cd,
property_profile.percent_complete, property_profile.ls_table,
property_profile.main_land_unit_price, property_profile.main_land_total_adj,
property_profile.zoning, property_profile.visibility_access_cd, property_profile.sub_market_cd,
property_profile.road_access, property_profile.land_useable_acres, property_profile.land_useable_sqft,
property_profile.property_use_cd, property_profile.last_appraisal_dt, property_profile.utilities, property_profile.topography,
property_profile.eff_yr_blt, property_profile.city_id, property_profile.num_imprv,
property_profile.imprv_det_sub_class_cd, property_profile.imprv_type_cd,
property_profile.class_cd_highvalueimprov, property_profile.imprv_det_sub_class_cd_highvalueimprov, property_profile.living_area_highvalueimprov

from property_profile
join property_val on
	property_profile.prop_id = property_val.prop_id and
	property_profile.prop_val_yr = property_val.prop_val_yr and
	property_profile.sup_num = property_val.sup_num
join owner on
	property_profile.prop_id = owner.prop_id and
	property_profile.prop_val_yr = owner.owner_tax_yr and
	property_profile.sup_num = owner.sup_num
join account on
	owner.owner_id = account.acct_id
left outer join situs on
	property_profile.prop_id = situs.prop_id and
	situs.primary_situs = 'Y'
left outer join entity as city_entity on
	property_profile.city_id = city_entity.entity_id
left outer join entity as school_entity on
	property_profile.school_id = school_entity.entity_id
left outer join chg_of_owner_prop_assoc on
	property_profile.prop_id = chg_of_owner_prop_assoc.prop_id and
	chg_of_owner_prop_assoc.seq_num = 0
left outer join sale on
	chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id
left outer join entity as sl_school_entity on
	sale.sl_school_id = sl_school_entity.entity_id
left outer join entity as sl_city_entity on
	sale.sl_city_id = sl_city_entity.entity_id

GO

