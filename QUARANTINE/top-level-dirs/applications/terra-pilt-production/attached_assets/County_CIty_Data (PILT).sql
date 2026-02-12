SELECT DISTINCT 
                         pv.prop_id, pv.cycle, p.geo_id, s.situs_city, ld.land_type_cd, ld.state_cd, ld.size_acres, ld.size_square_feet, ld.mkt_val_source, ld.land_seg_mkt_val, ld.mkt_flat_val, ld.mkt_adj_val, ta.tax_area_number, 
                         ta.tax_area_description, ta.tax_area_id, pta.is_annex_value, ld.mkt_unit_price, ld.ag_loss, ld.ag_unit_price, ld.ag_val, l.levy_type_cd
FROM            property_val AS pv WITH (nolock) INNER JOIN
                         prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         land_detail AS ld WITH (nolock) ON pv.prop_id = ld.prop_id AND pv.prop_val_yr = ld.prop_val_yr AND pv.sup_num = ld.sup_num AND ld.sale_id = 0 INNER JOIN
                         property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.prop_val_yr = pta.year AND pv.sup_num = pta.sup_num INNER JOIN
                         tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id AND ta.tax_area_number NOT LIKE '1%' INNER JOIN
                         situs AS s ON p.prop_id = s.prop_id INNER JOIN
                         levy l ON pta.year = l.year
WHERE        (pv.prop_val_yr =
                             (SELECT        appr_yr - 1 AS Expr1
                               FROM            pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.prop_id NOT IN
                             (SELECT        prop_id
                               FROM            property_exemption
                               WHERE        (exmpt_tax_yr =
                                                             (SELECT        appr_yr - 1 AS Expr1
                                                               FROM            pacs_system AS pacs_system_1)) AND (exmpt_type_cd IN ('SNR/DSBL', 'EX'))))
															   and l.levy_type_cd='reg'
															   and l.levy_cd='d 52'
ORDER BY ta.tax_area_number, p.geo_id