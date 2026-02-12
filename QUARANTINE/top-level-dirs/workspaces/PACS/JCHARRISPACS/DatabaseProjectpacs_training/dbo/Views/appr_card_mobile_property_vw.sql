
CREATE    VIEW dbo.appr_card_mobile_property_vw
AS
SELECT property.prop_id, property.prop_type_cd, 
    property.prop_create_dt, property.geo_id, 
    property_val.map_id, property_val.prop_val_yr, 
    property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.appraised_val, 
    property_val.ag_use_val, property_val.ag_market, 
    property_val.timber_market, property_val.timber_use, 
    property_val.ten_percent_cap, property_val.legal_desc, 
    property_val.legal_acreage,
    dbo.situs.primary_situs, dbo.situs.situs_num,
    dbo.situs.situs_street_prefx, dbo.situs.situs_street,
    dbo.situs.situs_street_sufix, dbo.situs.situs_unit,
    dbo.situs.situs_city, dbo.situs.situs_state,
    dbo.situs.situs_zip, dbo.situs.situs_display,
    property.utilities, property.topography, 
    property.road_access, property.other, property.zoning, 
    property.remarks, property_val.last_appraisal_yr, 
    property_val.last_appraisal_dt, property_val.next_appraisal_dt, 
    property_val.next_appraisal_rsn, property_val.image_path, 
    abs_subdv.abs_land_pct, abs_subdv.abs_imprv_pct, 
    abs_subdv.abs_subdv_yr, neighborhood.hood_yr, 
    neighborhood.hood_land_pct, neighborhood.hood_imprv_pct, 
    property_val.sup_num, property_val.shared_prop_cad_code, 
    property_val.recalc_flag, property_val.oil_wells, 
    property_val.irr_wells, property_val.irr_acres, 
    property_val.irr_capacity, property_val.eff_size_acres, 
    property_val.assessed_val, property_val.prop_inactive_dt, 
    property_val.hood_cd, property.ref_id1, property.ref_id2, 
    property.prop_sic_cd,
    appraiser.appraiser_nm AS last_appraiser_nm, 
    abs_subdv.abs_subdv_cd,
    property_val.udi_parent AS udi_parent,
    property_val.appr_method,
    property_val.udi_parent_prop_id
FROM property with (nolock)
    --can't join on last_appraiser_id until property_val has been joined in below (jmd)
    --LEFT OUTER JOIN appraiser 
    --ON property_val.last_appraiser_id = appraiser.appraiser_id
    LEFT OUTER JOIN situs with (nolock)
    ON property.prop_id = situs.prop_id AND
       situs.primary_situs = 'Y'
    LEFT OUTER JOIN
    neighborhood with (nolock) 
    RIGHT OUTER JOIN
    abs_subdv with (nolock) 
    RIGHT OUTER JOIN
    property_val with (nolock) 
    ON abs_subdv.abs_subdv_cd = property_val.mbl_hm_park AND 
       abs_subdv.abs_subdv_yr = property_val.prop_val_yr 
    ON 
       neighborhood.hood_cd = property_val.hood_cd AND 
       neighborhood.hood_yr = property_val.prop_val_yr 
    ON 
       property.prop_id = property_val.prop_id
    --new join location is here (jmd)
    LEFT OUTER JOIN appraiser with (nolock) 
    ON property_val.last_appraiser_id = appraiser.appraiser_id

GO

