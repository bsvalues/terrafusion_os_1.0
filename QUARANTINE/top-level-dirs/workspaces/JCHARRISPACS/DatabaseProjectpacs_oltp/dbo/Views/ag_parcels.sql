CREATE VIEW  ag_parcels
as


SELECT   distinct

     property_val.prop_id, property_val.ag_loss, property_val.ag_market, property_val.ag_use_val, property_val.assessed_val, property_val.appraised_val, property_val.imprv_non_hstd_val, 
                         property_val.imprv_hstd_val, property_val.land_non_hstd_val, property_val.land_hstd_val, property_val.legal_desc, property_val.legal_desc_2, property_val.legal_acreage, property_val.irr_acres, 
                         property_val.irr_capacity, property_val.irr_wells, property_val.cycle, property_val.ag_hs_use_val, property_val.ag_hs_mkt_val, property_val.ag_hs_loss, situs.situs_display, imprv.primary_use_cd, 
                         property_val.prop_val_yr, property_profile.class_cd, property_profile.land_type_cd, property_profile.yr_blt, property_profile.living_area, property_profile.land_sqft, property_profile.land_acres, 
                         property_profile.abs_subdv, property_profile.neighborhood, property_profile.appraised_val AS Expr1, property_profile.condition_cd, property_profile.percent_complete, property_profile.property_use_cd, 
                         property_profile.land_useable_sqft, property_profile.land_useable_acres, property_profile.road_access, property_profile.zoning, property_profile.imprv_type_cd, property_profile.imprv_det_sub_class_cd, 
                         property_profile.topography, property_profile.utilities
FROM            situs INNER JOIN
                         property_val ON situs.prop_id = property_val.prop_id INNER JOIN
                         property_profile ON situs.prop_id = property_profile.prop_id INNER JOIN
                         imprv ON property_val.prop_val_yr = imprv.prop_val_yr AND property_val.sup_num = imprv.sup_num AND property_val.prop_id = imprv.prop_id
WHERE        (imprv.primary_use_cd > '80') AND (property_val.prop_val_yr = 2018)

GO

