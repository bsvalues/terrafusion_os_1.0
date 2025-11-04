


CREATE VIEW CURR_APP_PROPERTY_OWNER_COLLIN_VW
AS
SELECT     o.owner_id, ac.acct_id AS acct_acct_id, ac.ref_id1 AS acct_ref_id1, prop_supp_assoc.owner_tax_yr AS sup_yr, prop_supp_assoc.sup_num, 
                      o.owner_tax_yr, o.hs_prop, o.updt_dt, o.pct_ownership, o.ag_app_filed, o.owner_cmnt, o.over_65_defer, o.over_65_date, ac.first_name, ac.dl_num, 
                      ac.last_name, ac.file_as_name, ac.confidential_file_as_name, ac.merged_acct_id, ac.dl_state, ac.acct_create_dt, ac.dl_expir_dt, ac.opening_balance, p.prop_create_dt, p.ref_id1, 
                      p.ref_id2, p.geo_id, p.ams_load_dt, p.prop_cmnt, p.prop_sic_cd, p.dba_name, p.alt_dba_name, property_val.last_appraiser_id, p.exmpt_reset, 
                      property_val.next_appraiser_id, p.gpm_irrig, property_val.last_appraisal_dt, property_val.next_appraisal_dt, property_val.next_appraisal_rsn, p.utilities, p.topography, p.road_access, p.other, 
                      p.zoning, p.remarks, p.prop_type_cd, t.prop_type_desc,
                      s.situs_id, s.primary_situs, s.situs_num, s.situs_street_prefx, s.situs_street, s.situs_street_sufix, s.situs_unit,
                      s.situs_city, s.situs_state, s.situs_zip, s.situs_display,
                      property_val.legal_desc, property_val.legal_desc_2, 
                      property_val.legal_acreage, ma.lease_id, p.prop_id AS owner_prop_id, property_val.prop_inactive_dt, property_val.eff_size_acres, 
                      property_val.orig_appraised_val, property_val.appraised_val, property_val.assessed_val, property_val.recalc_flag, 
                      property_val.appraised_val - property_val.orig_appraised_val AS convert_gain_loss, property_val.appr_company_id, 
                      property_val.abs_subdv_cd, property_val.hood_cd, property_val.block, property_val.tract_or_lot, property_val.mbl_hm_park, 
                      property_val.mbl_hm_space, property_val.rgn_cd, property_val.subset_cd, property_val.map_id, property_val.auto_build_legal, 
                      property_val.vit_flag,

convert(varchar(15),  property_val.prop_id) + '-' + convert(varchar(15), o.owner_id) + '-' +
convert(varchar(4),  property_val.prop_val_yr) + '- HS' as hs_barcode,
		      dbo.fn_GetEntities(p.prop_id, o.owner_tax_yr, prop_supp_assoc.sup_num) AS entities,
		      dbo.fn_GetSchoolEntities(p.prop_id, o.owner_tax_yr, prop_supp_assoc.sup_num) AS school_codes

FROM         mineral_acct ma RIGHT OUTER JOIN
                      property_type t INNER JOIN
                      property p ON t.prop_type_cd = p.prop_type_cd INNER JOIN
                      prop_supp_assoc ON p.prop_id = prop_supp_assoc.prop_id INNER JOIN
                      property_val ON prop_supp_assoc.prop_id = property_val.prop_id AND prop_supp_assoc.sup_num = property_val.sup_num AND 
                      prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr LEFT OUTER JOIN
                      owner o INNER JOIN
                      account ac ON o.owner_id = ac.acct_id ON prop_supp_assoc.prop_id = o.prop_id AND 
                      prop_supp_assoc.owner_tax_yr = o.owner_tax_yr AND prop_supp_assoc.sup_num = o.sup_num LEFT OUTER JOIN
                      situs s ON p.prop_id = s.prop_id and s.primary_situs = 'Y' ON ma.prop_id = p.prop_id
WHERE     (property_val.prop_val_yr IN
                          (SELECT     MAX(owner_tax_yr)
                            FROM          prop_supp_assoc
                            WHERE      prop_id = p.prop_id)) AND (property_val.prop_inactive_dt IS NULL)

GO

