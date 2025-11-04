

create view [dbo].[_benton_land_sale] as

SELECT
                         p.geo_id , pv.prop_id, pv.cycle AS 'Reval', abs_subdv.abs_subdv_desc AS 'Subdivision', pv.hood_cd AS 'Nbhd', coo.deed_type_cd , coo.excise_number AS 'ExciseAffidavit', 
                         CONVERT(varchar(20), s.sl_dt, 101) AS 'SaleDate', s.sl_price AS 'SalePrice', pv.appraised_val, s.sl_ratio_type_cd AS 'Ratio_cd', 
                         CASE WHEN pv.market <> 0 THEN CAST(round((pv.market / s.sl_price), 2) AS decimal(10, 2)) ELSE 0 END AS Ratio, pp.property_use_cd, pv.abs_subdv_cd, pv.eff_size_acres, pv.land_hstd_val+ 
                         pv.land_non_hstd_val as 'LandVal', ta.tax_area_description as 'TCA', wta.tax_area_id as 'TaxAreaId', pv.cost_land_hstd_val+ pv.cost_land_non_hstd_val as 'CostLandVal', pv.cost_imprv_hstd_val+ pv.cost_imprv_non_hstd_val as 'CostImprvVal', pv.cost_market, 
                         pp.land_type_cd
FROM            property_val AS pv WITH (nolock) INNER JOIN
                         prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr INNER JOIN
                         chg_of_owner_prop_assoc AS copa WITH (nolock) ON pv.prop_id = copa.prop_id INNER JOIN
                         chg_of_owner AS coo WITH (nolock) ON copa.chg_of_owner_id = coo.chg_of_owner_id INNER JOIN
                         sale AS s WITH (nolock) ON copa.chg_of_owner_id = s.chg_of_owner_id INNER JOIN
                         wash_prop_owner_tax_area_assoc AS wta WITH (nolock) ON wta.year = pv.prop_val_yr AND wta.prop_id = pv.prop_id AND wta.sup_num = pv.sup_num INNER JOIN
                         tax_area AS ta WITH (nolock) ON ta.tax_area_id = wta.tax_area_id INNER JOIN
                         abs_subdv ON pv.abs_subdv_cd = abs_subdv.abs_subdv_cd AND pv.prop_val_yr = abs_subdv.abs_subdv_yr LEFT OUTER JOIN
                         imprv AS i WITH (nolock) ON pv.prop_id = i.prop_id AND pv.prop_val_yr = i.prop_val_yr AND pv.sup_num = i.sup_num AND i.sale_id = 0 LEFT OUTER JOIN
                         imprv_detail AS idt WITH (nolock) ON pv.prop_id = idt.prop_id AND pv.prop_val_yr = idt.prop_val_yr AND pv.sup_num = idt.sup_num AND idt.sale_id = 0 AND idt.imprv_det_type_cd = 'bsmt' LEFT OUTER JOIN
                         situs AS si WITH (nolock) ON pv.prop_id = si.prop_id AND ISNULL(si.primary_situs, 'n') = 'y'
WHERE     (s.sl_price > 0) and (pp.imprv_type_cd IS NULL)

GO

