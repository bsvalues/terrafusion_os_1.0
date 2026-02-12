
CREATE VIEW PROPERTY_OWNER_VW
AS
SELECT distinct o.owner_id, 
		ac.acct_id AS acct_acct_id, 
		ac.ref_id1 AS acct_ref_id1, 
		psa.owner_tax_yr AS sup_yr, 
		psa.sup_num, 
		o.owner_tax_yr, 
		o.hs_prop, 
		o.updt_dt, 
		o.pct_ownership, 
		o.ag_app_filed, 
		o.owner_cmnt, 
		o.over_65_defer, 
		o.over_65_date, 
		ac.first_name, 
		ac.dl_num, 
		ac.last_name, 
		ac.file_as_name, 
		ac.merged_acct_id, 
		ac.dl_state, 
		ac.acct_create_dt, 
		ac.dl_expir_dt, 
		ac.opening_balance, 
		pv.abs_subdv_cd, 
		p.prop_create_dt, 
		pv.hood_cd, 
		pv.block, 
		pv.tract_or_lot, 
		pv.mbl_hm_park, 
		pv.mbl_hm_space, 
		pv.auto_build_legal, 
		p.ref_id1, 
		p.ref_id2, 
		p.geo_id,
		p.simple_geo_id, 
		pv.rgn_cd, 
		pv.subset_cd, 
		pv.map_id, 
		p.ams_load_dt, 
		p.prop_cmnt, 
		p.prop_sic_cd, 
		p.dba_name, 
		p.alt_dba_name, 
		pv.last_appraiser_id, 
		p.exmpt_reset, 
		pv.next_appraiser_id, 
		p.gpm_irrig, 
		pv.last_appraisal_dt, 
		pv.next_appraisal_dt, 
		pv.next_appraisal_rsn, 
		p.utilities, 
		p.topography, 
		p.road_access, 
		p.other, 
		p.zoning, 
		p.remarks, 
		p.prop_type_cd, 
		t.prop_type_desc, 
		s.situs_id, 
                s.primary_situs, s.situs_num,
                s.situs_street_prefx, s.situs_street,
                s.situs_street_sufix, s.situs_unit,
                s.situs_city, s.situs_state,
                s.situs_zip, s.situs_display,
		pv.legal_desc, 
		pv.legal_desc_2, 
		pv.legal_acreage, 
		CASE WHEN ISNULL(lease_flag, 0) = 0 THEN ma.lease_id ELSE lpa.lease_id END as lease_id,
		p.prop_id AS owner_prop_id, 
		pv.prop_inactive_dt, 
		pv.eff_size_acres, 
		pv.appr_company_id, 
		ad.primary_addr, 
		p.mass_created_from, 
		pv.vit_flag, 
		ac.confidential_file_as_name, 
		ac.confidential_first_name, 
		ac.confidential_last_name, 
		pv.appraised_val, 
		imprv.mbl_hm_sn, 
		imprv.mbl_hm_title_num,
		imprv.mbl_hm_hud_num,
		rtrim(pv.udi_parent) as udi_parent,
		pv.udi_parent_prop_id,
		pv.udi_status,
		pp.imprv_type_cd,
		ad.addr_type_cd,
		pv.market,
		pp.state_cd

FROM property_val as pv with (nolock)

INNER JOIN prop_supp_assoc as psa with (nolock)
ON pv.prop_id = psa.prop_id
AND pv.prop_val_yr = psa.owner_tax_yr
AND pv.sup_num = psa.sup_num

INNER JOIN property as p with (nolock)
ON pv.prop_id = p.prop_id

INNER JOIN property_type as t with (nolock)
ON p.prop_type_cd = t.prop_type_cd

INNER JOIN owner as o with (nolock)
ON pv.prop_id = o.prop_id
AND pv.prop_val_yr = o.owner_tax_yr
AND pv.sup_num = o.sup_num

INNER JOIN account as ac with (nolock)
ON o.owner_id = ac.acct_id

INNER JOIN address as ad with (nolock)
ON o.owner_id = ad.acct_id
and ad.primary_addr = 'Y'

INNER JOIN pacs_system with (nolock)
ON system_type IN ('A', 'B')

LEFT OUTER JOIN property_profile as pp with (nolock)
ON pv.prop_id = pp.prop_id
AND pv.prop_val_yr = pp.prop_val_yr
-- AND pv.sup_num = pp.sup_num

LEFT OUTER JOIN imprv with (nolock)
ON pv.prop_id = imprv.prop_id
AND pv.prop_val_yr = imprv.prop_val_yr
AND pv.sup_num = imprv.sup_num

LEFT OUTER JOIN situs as s with (nolock)
ON pv.prop_id = s.prop_id AND
   s.primary_situs = 'Y'

LEFT OUTER JOIN mineral_acct as ma with (nolock)
ON pv.prop_id = ma.prop_id

LEFT OUTER JOIN lease_prop_assoc as lpa with (nolock)
ON pv.prop_id = lpa.prop_id
AND pv.prop_val_yr = lpa.lease_yr
AND pv.sup_num = lpa.sup_num
AND lpa.rev_num = (SELECT MAX(rev_num)
					FROM lease_prop_assoc with (nolock)
					WHERE lpa.prop_id = prop_id
					AND lpa.lease_id = lease_id
					AND lpa.lease_yr = lease_yr
					AND lpa.sup_num = sup_num)

GO

