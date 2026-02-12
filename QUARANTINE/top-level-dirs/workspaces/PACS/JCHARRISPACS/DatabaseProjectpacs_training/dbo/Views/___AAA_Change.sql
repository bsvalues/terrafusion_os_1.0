create view ___AAA_Change as 
SELECT        
pv1.prop_id, pv1.cycle, 
pv1.prop_val_yr AS year_before, 
pv1.market AS market_val_yr_before, 
pv2.prop_val_yr AS year_after, 
pv2.market AS market_val_yr_after, 
CAST(ISNULL(pv2.market, 0) - ISNULL(pv1.market, 0) 
                         AS numeric(18, 4)) / (CASE WHEN pv1.market IS NULL THEN 1 WHEN pv1.market = 0 THEN 1 ELSE pv1.market END) * 100/100 AS percent_change, 
						 ISNULL(pv2.new_val_hs, 0) + ISNULL(pv2.new_val_nhs, 0) 
                         + ISNULL(pv2.new_val_p, 0) AS new_val,
						 pp.property_use_cd, property_profile.region AS region_before, 
						 property_profile.abs_subdv AS abs_sub_before, 
						 property_profile.neighborhood AS hood_before, 
						 pp.region AS region_after, 
                         pp.neighborhood AS hood_after,
						 pp.abs_subdv AS abs_sub_after, 
						 property_profile.condition_cd AS condition_before, 
						 pp.condition_cd AS condition_after, pp.land_acres, 
						 pp.imprv_type_cd, pv1.imprv_hstd_val + 
                         pv1.imprv_non_hstd_val AS imprv_before, 
						 pv2.imprv_hstd_val + pv2.imprv_non_hstd_val AS imprv_after, pv1.land_hstd_val + pv1.land_non_hstd_val AS land_before, 
						 pv2.land_hstd_val + pv2.land_non_hstd_val AS land_after, 
						 pp.yr_blt AS yr_blt_after, 
						 property_profile.class_cd AS class_before, 
						 pp.class_cd AS class_after, 
						 property_profile.land_type_cd AS land_type_before, 
						 pp.land_type_cd as land_type18 , 
						 property_profile.yr_blt, 
                         property_profile.living_area AS living_area_before, 
						 pp.living_area AS living_area_after, 
						 property_profile.imprv_unit_price AS imprv_unit_price_before,
						 pp.imprv_unit_price AS unit_price_after, 
                         property_profile.land_sqft AS land_sqft_before, 
						 pp.land_sqft AS land_sqft_after,
						 property_profile.land_unit_price AS land_unit_price_before, 
						 pp.land_unit_price AS land_unit_price_after,			 
						 pv1.imprv_hstd_val + pv1.imprv_non_hstd_val  AS imprv_val_yr_before,  
						 pv2.imprv_hstd_val + pv2.imprv_non_hstd_val AS imprv_val_yr_after, 
						 CAST(ISNULL(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val, 0) - ISNULL(pv1.imprv_hstd_val + pv1.imprv_non_hstd_val, 0) 
                         AS numeric(18, 4)) / (CASE WHEN  pv1.imprv_hstd_val + pv1.imprv_non_hstd_val IS NULL THEN 1 WHEN pv1.imprv_hstd_val + pv1.imprv_non_hstd_val = 0 
						 THEN 1 ELSE pv1.imprv_hstd_val + pv1.imprv_non_hstd_val END) * 100/100 as imprv_percent_change,

						  pv1.land_hstd_val + pv1.land_non_hstd_val  AS land_val_yr_before,  pv2.land_hstd_val + pv2.land_non_hstd_val AS land_val_yr_after, 
						  CAST(ISNULL(pv2.land_hstd_val + pv2.land_non_hstd_val, 0) - ISNULL(pv1.land_hstd_val + pv1.land_non_hstd_val, 0) 
                         AS numeric(18, 4)) / (CASE WHEN  pv1.land_hstd_val + pv1.land_non_hstd_val IS NULL THEN 1 WHEN pv1.land_hstd_val + pv1.land_non_hstd_val = 0 
						 THEN 1 ELSE pv1.land_hstd_val + pv1.land_non_hstd_val END) * 100/100 as land_percent_change


FROM            property_val AS pv1 INNER JOIN
                         prop_supp_assoc AS psa1 
						 ON psa1.prop_id = pv1.prop_id AND psa1.owner_tax_yr = pv1.prop_val_yr AND psa1.sup_num = pv1.sup_num 
						 INNER JOIN
                         property_val AS pv2 
						 ON pv2.prop_id = pv1.prop_id 
						 INNER JOIN
                         prop_supp_assoc AS psa2 
						 ON psa2.prop_id = pv2.prop_id AND psa2.owner_tax_yr = pv2.prop_val_yr AND psa2.sup_num = pv2.sup_num 
						 INNER JOIN
                         property_profile AS pp 
						 ON pp.prop_id = pv2.prop_id AND pp.prop_val_yr = pv2.prop_val_yr 
						 INNER JOIN
                         property_profile 
						 ON pv1.prop_id = property_profile.prop_id
						 LEFT OUTER JOIN
                         appraiser AS ap WITH (nolock) 
						 ON pv1.next_appraiser_id = ap.appraiser_id 
						 LEFT OUTER JOIN
                         appraiser AS ap1 WITH (nolock) 
						 ON pv2.last_appraiser_id = ap1.appraiser_id 


						 
WHERE pv2.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)  
			and pv2.prop_inactive_dt is null
			and pv2.sup_num=0    
			and   pv2.prop_inactive_dt is null
		
			and
(pv1.prop_val_yr = (select appr_yr from pacs_system)-1) AND 
(pv2.prop_val_yr = (select appr_yr from pacs_system)) AND 
(pp.prop_val_yr = (select appr_yr from pacs_system) AND
(property_profile.prop_val_yr = (select appr_yr from pacs_system)-1))
and pv2.hood_cd like '1%'
--and pv2.cycle=4
--and pv2.prop_id=13179

GO

