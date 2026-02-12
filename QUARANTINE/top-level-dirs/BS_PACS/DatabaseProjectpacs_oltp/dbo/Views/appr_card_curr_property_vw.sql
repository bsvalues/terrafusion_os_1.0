
CREATE   VIEW dbo.appr_card_curr_property_vw
AS
SELECT
	dbo.property.prop_id, dbo.property.prop_type_cd, dbo.property.prop_create_dt, 
	dbo.property.geo_id, dbo.property_val.map_id, dbo.property_val.prop_val_yr, 
	dbo.property_val.land_hstd_val, dbo.property_val.land_non_hstd_val, 
	dbo.property_val.imprv_hstd_val, dbo.property_val.imprv_non_hstd_val, dbo.property_val.appraised_val, 
	dbo.property_val.ag_use_val, dbo.property_val.ag_market, dbo.property_val.timber_market, 
	dbo.property_val.timber_use, dbo.property_val.ten_percent_cap, dbo.property_val.legal_desc, 
	dbo.property_val.legal_acreage, dbo.situs.primary_situs, dbo.situs.situs_num, 
	dbo.situs.situs_street_prefx, dbo.situs.situs_street, dbo.situs.situs_street_sufix, 
	dbo.situs.situs_unit,dbo.situs.situs_city, dbo.situs.situs_state, dbo.situs.situs_zip, 
	dbo.situs.situs_display, dbo.property.utilities, dbo.property.topography, dbo.property.road_access, 
	dbo.property.other, dbo.property.zoning, dbo.property.remarks, dbo.property_val.last_appraisal_yr, 
	dbo.property_val.last_appraisal_dt, dbo.property_val.next_appraisal_dt, dbo.property_val.next_appraisal_rsn, 
	dbo.property_val.image_path, dbo.abs_subdv.abs_land_pct, dbo.abs_subdv.abs_imprv_pct, 
	dbo.abs_subdv.abs_subdv_yr, dbo.neighborhood.hood_yr, dbo.neighborhood.hood_land_pct, 
	dbo.neighborhood.hood_imprv_pct, dbo.property_val.sup_num, dbo.property_val.shared_prop_cad_code, 
	dbo.property_val.recalc_flag, dbo.property_val.oil_wells, dbo.property_val.irr_wells, 
	dbo.property_val.irr_acres, dbo.property_val.irr_capacity, dbo.property_val.eff_size_acres, 
	dbo.property_val.assessed_val, dbo.property_val.prop_inactive_dt, dbo.property_val.abs_subdv_cd, 
	dbo.property_val.hood_cd, dbo.property.ref_id1, dbo.property.ref_id2, dbo.property.prop_sic_cd, 
	dbo.appraiser.appraiser_nm AS last_appraiser_nm, dbo.property.dba_name, 
	dbo.property_val.udi_parent AS udi_parent, 
	dbo.property_val.appr_method,
	dbo.property_val.udi_parent_prop_id
FROM dbo.neighborhood with (nolock)
RIGHT OUTER JOIN	
	dbo.property with (nolock)
	INNER JOIN dbo.prop_supp_assoc with (nolock)
		ON dbo.property.prop_id = dbo.prop_supp_assoc.prop_id 
	INNER JOIN dbo.property_val with (nolock)
		ON dbo.prop_supp_assoc.prop_id = dbo.property_val.prop_id 
		AND dbo.prop_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr 
		AND dbo.prop_supp_assoc.sup_num = dbo.property_val.sup_num 
	LEFT OUTER JOIN dbo.appraiser with (nolock)
		ON dbo.property_val.last_appraiser_id = dbo.appraiser.appraiser_id 
	LEFT OUTER JOIN dbo.situs with (nolock)
		ON dbo.property.prop_id = dbo.situs.prop_id 
		AND dbo.situs.primary_situs = 'Y' 
	LEFT OUTER JOIN dbo.abs_subdv with (nolock)
		ON dbo.property_val.abs_subdv_cd = dbo.abs_subdv.abs_subdv_cd 
		AND dbo.property_val.prop_val_yr = dbo.abs_subdv.abs_subdv_yr 
	ON dbo.neighborhood.hood_cd = dbo.property_val.hood_cd 
	AND dbo.neighborhood.hood_yr = dbo.property_val.prop_val_yr

GO

