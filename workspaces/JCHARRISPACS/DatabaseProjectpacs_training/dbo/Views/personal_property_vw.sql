create view personal_property_vw as 

SELECT        appr_card_pers_prop_vw.prop_id, appr_card_pers_prop_vw.prop_val_yr, appr_card_pers_prop_vw.sup_num, appr_card_pers_prop_vw.pp_seg_id, appr_card_pers_prop_vw.sale_id, 
                         appr_card_pers_prop_vw.pp_type_cd, appr_card_pers_prop_vw.pp_description, appr_card_pers_prop_vw.pp_type_desc, appr_card_pers_prop_vw.pp_qual_cd, appr_card_pers_prop_vw.pp_class_cd, 
                         appr_card_pers_prop_vw.pp_area, appr_card_pers_prop_vw.pp_unit_count, appr_card_pers_prop_vw.pp_yr_aquired, appr_card_pers_prop_vw.pp_orig_cost, appr_card_pers_prop_vw.pp_unit_price, 
                         appr_card_pers_prop_vw.pp_pct_good, appr_card_pers_prop_vw.pp_deprec_deprec_cd, appr_card_pers_prop_vw.pp_deprec_pct, appr_card_pers_prop_vw.pp_prior_yr_val, 
                         appr_card_pers_prop_vw.pp_appraised_val, appr_card_pers_prop_vw.pp_rendered_val, appr_card_pers_prop_vw.pp_appraise_meth, appr_card_pers_prop_vw.pp_mkt_val, 
                         appr_card_pers_prop_vw.pp_density_cd, prop_links.parent_prop_id, prop_links.x, prop_links.y, prop_links.prop_id AS Expr1
FROM            appr_card_pers_prop_vw INNER JOIN
                         prop_links ON appr_card_pers_prop_vw.prop_id = prop_links.parent_prop_id
WHERE        (appr_card_pers_prop_vw.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system))

GO

