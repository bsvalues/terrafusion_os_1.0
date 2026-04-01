--irrigated acres
SELECT DISTINCT 
                         pv.prop_id, p.geo_id, ld.land_type_cd, ld.size_acres, ld.mkt_val_source, ld.land_seg_mkt_val, ld.mkt_flat_val, ld.mkt_adj_val, ld.ag_unit_price, ld.ag_val, ld.ag_adj_val, ld.ag_calc_val, ld.ag_flat_val, 
                         ld.ag_val_source
FROM            property_val AS pv WITH (nolock) INNER JOIN
                         prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         land_detail AS ld WITH (nolock) ON pv.prop_id = ld.prop_id AND pv.prop_val_yr = ld.prop_val_yr AND pv.sup_num = ld.sup_num AND ld.sale_id = 0 AND ld.land_type_cd IN ('4', '41', '42', '45', '46', '47')
WHERE        (pv.prop_val_yr = 2018) AND (pv.prop_inactive_dt IS NULL) AND (pv.prop_id NOT IN
                             (SELECT        prop_id
                               FROM            property_exemption
                               WHERE        (exmpt_tax_yr = 2018) --AND (exmpt_type_cd IN ('SNR/DSBL', 'EX'))))
ORDER BY p.geo_id


--dry acres


SELECT DISTINCT 
                         pv.prop_id, p.geo_id, ld.land_type_cd, ld.size_acres, ld.mkt_val_source, ld.land_seg_mkt_val, ld.mkt_flat_val, ld.mkt_adj_val, ld.ag_unit_price, ld.ag_val, ld.ag_adj_val, ld.ag_calc_val, ld.ag_flat_val, 
                         ld.ag_val_source
FROM            property_val AS pv WITH (nolock) INNER JOIN
                         prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         land_detail AS ld WITH (nolock) ON pv.prop_id = ld.prop_id AND pv.prop_val_yr = ld.prop_val_yr AND pv.sup_num = ld.sup_num AND ld.sale_id = 0 
						 AND ld.land_type_cd IN ('5','51')
WHERE        (pv.prop_val_yr = 2018) AND (pv.prop_inactive_dt IS NULL) AND (pv.prop_id NOT IN
                             (SELECT        prop_id
                               FROM            property_exemption
                               WHERE        (exmpt_tax_yr = 2018) AND (exmpt_type_cd IN ('SNR/DSBL', 'EX'))))
ORDER BY p.geo_id


--exempt parcels

SELECT DISTINCT 
                         pv.prop_id, p.geo_id, pv.cycle, dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) AS Exemptions, pv.assessed_val, pv.market, pv.ag_use_val, pv.ag_market, pv.ag_loss, pv.ag_late_loss
FROM            property_val AS pv WITH (nolock) INNER JOIN
                         prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         land_detail AS ld WITH (nolock) ON pv.prop_id = ld.prop_id AND pv.prop_val_yr = ld.prop_val_yr AND pv.sup_num = ld.sup_num AND ld.sale_id = 0
WHERE        (pv.prop_val_yr = 2019) AND (pv.prop_inactive_dt IS NULL) AND (pv.prop_id IN
                             (SELECT        prop_id
                               FROM            property_exemption
                               WHERE        (exmpt_tax_yr = 2018) AND (exmpt_type_cd IN ('SNR/DSBL', 'EX'))))
ORDER BY p.geo_id
