
CREATE  VIEW dbo.PROPERTY_OWNER_COLLIN_VW
AS
SELECT o.owner_id, ac.acct_id AS acct_acct_id, 
    ac.ref_id1 AS acct_ref_id1, 
    dbo.prop_supp_assoc.owner_tax_yr AS sup_yr, 
    dbo.prop_supp_assoc.sup_num, dbo.prop_supp_assoc.owner_tax_yr as owner_tax_yr, o.hs_prop, 
    o.updt_dt, o.pct_ownership, o.ag_app_filed, o.owner_cmnt, 
    o.over_65_defer, o.over_65_date, ac.first_name, ac.dl_num, 
    ac.last_name, ac.file_as_name, ac.merged_acct_id, 
    ac.dl_state, ac.acct_create_dt, ac.dl_expir_dt, 
    ac.opening_balance, dbo.property_val.abs_subdv_cd, 
    p.prop_create_dt, dbo.property_val.hood_cd, 
    dbo.property_val.block, dbo.property_val.tract_or_lot, 
    dbo.property_val.mbl_hm_park, 
    dbo.property_val.mbl_hm_space, 
    dbo.property_val.auto_build_legal, p.ref_id1, p.ref_id2, 
    coalesce(p.geo_id, space(50)) as geo_id, dbo.property_val.rgn_cd, 
    dbo.property_val.subset_cd, dbo.property_val.map_id, 
    p.ams_load_dt, p.prop_cmnt, p.prop_sic_cd, p.dba_name, 
    p.alt_dba_name, property_val.last_appraiser_id, p.exmpt_reset, 
    property_val.next_appraiser_id, p.gpm_irrig, property_val.last_appraisal_dt, 
    property_val.next_appraisal_dt, property_val.next_appraisal_rsn, p.utilities, 
    p.topography, p.road_access, p.other, p.zoning, p.remarks, 
    p.prop_type_cd, t.prop_type_desc,
    s.situs_id, s.primary_situs, s.situs_num, s.situs_street_prefx,
    s.situs_street, s.situs_street_sufix, s.situs_unit, s.situs_city,
    s.situs_state, s.situs_zip, s.situs_display,
    dbo.property_val.legal_desc, dbo.property_val.legal_desc_2, 
    dbo.property_val.legal_acreage, ma.lease_id, 
    p.prop_id AS owner_prop_id, 
    dbo.property_val.prop_inactive_dt, 
    dbo.property_val.eff_size_acres, 
    dbo.property_val.appr_company_id, 
    dbo.address.primary_addr, p.mass_created_from, 
    dbo.property_val.vit_flag, ac.confidential_file_as_name, 
    ac.confidential_first_name, ac.confidential_last_name, 
    dbo.property_val.appraised_val, dbo.imprv.mbl_hm_sn, 
    dbo.imprv.mbl_hm_title_num,
    dbo.imprv.mbl_hm_hud_num,
    dbo.fn_GetEntities(p.prop_id, o.owner_tax_yr, dbo.prop_supp_assoc.sup_num) AS entities,
    dbo.fn_GetSchoolEntities(p.prop_id, o.owner_tax_yr, dbo.prop_supp_assoc.sup_num) AS school_codes,
    dbo.fn_GetPreviousMarketValue(p.prop_id, o.owner_tax_yr, dbo.prop_supp_assoc.sup_num) AS prev_market,
    dbo.property_val.udi_parent, dbo.property_val.udi_parent_prop_id, dbo.property_val.udi_status,
    dbo.property_profile.state_cd
FROM dbo.property_type t with (nolock) 
INNER JOIN dbo.property p with (nolock) 
	ON t.prop_type_cd = p.prop_type_cd 
INNER JOIN dbo.prop_supp_assoc with (nolock) 
	ON p.prop_id = dbo.prop_supp_assoc.prop_id 
INNER JOIN dbo.property_val with (nolock) 
	ON dbo.prop_supp_assoc.prop_id = dbo.property_val.prop_id 
	AND dbo.prop_supp_assoc.sup_num = dbo.property_val.sup_num 
	AND dbo.prop_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr 
	AND dbo.property_val.prop_inactive_dt IS NULL
LEFT OUTER JOIN dbo.property_profile with (nolock)
	ON dbo.property_profile.prop_id = dbo.property_val.prop_id
	AND dbo.property_profile.prop_val_yr = dbo.property_val.prop_val_yr
LEFT OUTER JOIN dbo.imprv with (nolock) 
	ON dbo.property_val.prop_id = dbo.imprv.prop_id 
	AND dbo.property_val.prop_val_yr = dbo.imprv.prop_val_yr 
	AND dbo.property_val.sup_num = dbo.imprv.sup_num 
LEFT OUTER JOIN dbo.owner o with (nolock) 
	INNER JOIN dbo.account ac 
		ON o.owner_id = ac.acct_id 
	INNER JOIN dbo.address with (nolock) 
		ON ac.acct_id = dbo.address.acct_id 
		AND dbo.address.primary_addr = 'Y' 
	ON dbo.prop_supp_assoc.prop_id = o.prop_id 
	AND dbo.prop_supp_assoc.owner_tax_yr = o.owner_tax_yr 
	AND dbo.prop_supp_assoc.sup_num = o.sup_num 
LEFT OUTER JOIN dbo.situs s with (nolock) 
	ON p.prop_id = s.prop_id  
	AND s.primary_situs = 'Y' 
LEFT OUTER JOIN dbo.mineral_acct ma with (nolock) 
	ON p.prop_id = ma.prop_id

GO

