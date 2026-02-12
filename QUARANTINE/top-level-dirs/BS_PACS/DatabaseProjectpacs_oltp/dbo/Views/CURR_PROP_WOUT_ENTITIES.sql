




CREATE  VIEW dbo.CURR_PROP_WOUT_ENTITIES
AS
SELECT prop_supp_assoc.sup_num, property_val.abs_subdv_cd, 
    p.prop_create_dt, property_val.hood_cd, property_val.block, 
    property_val.tract_or_lot, property_val.mbl_hm_park, 
    property_val.mbl_hm_space, property_val.auto_build_legal, 
    p.ref_id1, p.ref_id2, p.geo_id, property_val.rgn_cd, 
    property_val.subset_cd, property_val.map_id, p.ams_load_dt, 
    p.prop_cmnt, p.prop_sic_cd, p.dba_name, p.alt_dba_name, 
    property_val.last_appraiser_id, p.exmpt_reset, property_val.next_appraiser_id, 
    p.gpm_irrig, property_val.last_appraisal_dt, property_val.next_appraisal_dt, 
    property_val.next_appraisal_rsn, p.utilities, p.topography, p.road_access, 
    p.other, p.zoning, p.remarks, p.prop_type_cd, 
    property_val.legal_desc, property_val.legal_desc_2, 
    property_val.legal_acreage, p.prop_id AS owner_prop_id, 
    property_val.prop_inactive_dt, property_val.eff_size_acres, 
    property_val.orig_appraised_val, property_val.appraised_val, 
    property_val.assessed_val, property_val.recalc_flag, 
    prop_supp_assoc.owner_tax_yr AS sup_yr, 
    property_val.prop_val_yr, property_val.vit_flag
FROM property p INNER JOIN
    prop_supp_assoc ON 
    p.prop_id = prop_supp_assoc.prop_id INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num LEFT OUTER
     JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.sup_num = entity_prop_assoc.sup_num AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr
WHERE (property_val.prop_id NOT IN
        (SELECT prop_id
      FROM entity_prop_assoc
      WHERE entity_prop_assoc.prop_id = property_val.prop_id AND
            entity_prop_assoc.sup_num = property_val.sup_num AND
            entity_prop_assoc.tax_yr = property_val.prop_val_yr)) 
    AND (property_val.prop_inactive_dt IS NULL)

GO

