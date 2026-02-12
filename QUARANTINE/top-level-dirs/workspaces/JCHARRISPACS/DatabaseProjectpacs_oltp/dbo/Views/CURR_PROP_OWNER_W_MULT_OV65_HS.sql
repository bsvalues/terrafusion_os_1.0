


CREATE VIEW dbo.CURR_PROP_OWNER_W_MULT_OV65_HS
AS
SELECT DISTINCT 
    owner_id, acct_acct_id, acct_ref_id1, sup_yr, sup_num, 
    owner_tax_yr, hs_prop, updt_dt, pct_ownership, ag_app_filed, 
    owner_cmnt, over_65_defer, over_65_date, first_name, 
    dl_num, last_name, file_as_name, merged_acct_id, dl_state, 
    acct_create_dt, dl_expir_dt, opening_balance, abs_subdv_cd, 
    prop_create_dt, block, hood_cd, tract_or_lot, mbl_hm_park, 
    mbl_hm_space, auto_build_legal, ref_id1, ref_id2, geo_id, 
    rgn_cd, subset_cd, map_id, ams_load_dt, prop_cmnt, 
    prop_sic_cd, dba_name, alt_dba_name, last_appraiser_id, 
    exmpt_reset, next_appraiser_id, gpm_irrig, last_appraisal_dt, 
    next_appraisal_dt, next_appraisal_rsn, utilities, topography, 
    road_access, other, zoning, remarks, prop_type_cd, 
    prop_type_desc, legal_desc, legal_desc_2, legal_acreage, 
    lease_id, owner_prop_id, prop_inactive_dt, eff_size_acres, 
    orig_appraised_val, appraised_val, assessed_val, recalc_flag, 
    convert_gain_loss, vit_flag
FROM CURR_PROPERTY_OWNER_VW
WHERE (prop_inactive_dt IS NULL) AND EXISTS
        (SELECT COUNT(exmpt_type_cd)
      FROM prop_exemption_vw
      WHERE CURR_PROPERTY_OWNER_VW.owner_id = prop_exemption_vw.owner_id
            AND 
           prop_exemption_vw.exmpt_tax_yr = CURR_PROPERTY_OWNER_VW.sup_yr
            AND 
           prop_exemption_vw.exmpt_type_cd = 'HS'
      HAVING COUNT(exmpt_type_cd) > 1) OR
    (prop_inactive_dt IS NULL) AND EXISTS
        (SELECT COUNT(exmpt_type_cd)
      FROM prop_exemption_vw
      WHERE CURR_PROPERTY_OWNER_VW.owner_id = prop_exemption_vw.owner_id
            AND 
           prop_exemption_vw.exmpt_tax_yr = CURR_PROPERTY_OWNER_VW.sup_yr
            AND 
           prop_exemption_vw.exmpt_type_cd = 'OV65'
      HAVING COUNT(exmpt_type_cd) > 1) OR
    (prop_inactive_dt IS NULL) AND EXISTS
        (SELECT COUNT(exmpt_type_cd)
      FROM prop_exemption_vw
      WHERE CURR_PROPERTY_OWNER_VW.owner_id = prop_exemption_vw.owner_id
            AND 
           prop_exemption_vw.exmpt_tax_yr = CURR_PROPERTY_OWNER_VW.sup_yr
            AND 
           prop_exemption_vw.exmpt_type_cd = 'OV65-S'
      HAVING COUNT(exmpt_type_cd) > 1) OR
    (prop_inactive_dt IS NULL) AND EXISTS
        (SELECT COUNT(exmpt_type_cd)
      FROM prop_exemption_vw
      WHERE CURR_PROPERTY_OWNER_VW.owner_id = prop_exemption_vw.owner_id
            AND 
           prop_exemption_vw.exmpt_tax_yr = CURR_PROPERTY_OWNER_VW.sup_yr
            AND 
           prop_exemption_vw.exmpt_type_cd = 'OV65S'
      HAVING COUNT(exmpt_type_cd) > 1)

GO

