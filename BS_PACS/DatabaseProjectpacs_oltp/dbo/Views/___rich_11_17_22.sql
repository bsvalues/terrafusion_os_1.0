create view ___rich_11_17_22 as

SELECT DISTINCT 

pv.prop_id, p.geo_id, pv.cycle, ta.tax_area_number AS tca, REPLACE(ac.file_as_name, ',', '') AS owner, a.addr_line1, a.addr_line2, a.addr_line3, a.addr_city, a.addr_state, a.addr_zip, s.situs_num, s.situs_street_prefx, s.situs_street, s.situs_street_sufix, s.situs_city, s.situs_state, s.situs_zip, s.situs_unit, pv.township_section AS section, pv.township_code AS township, 
                         pv.range_code AS range, pv.township_q_section AS qtr_section, pv.imprv_hstd_val + pv.imprv_non_hstd_val AS imprv_value, 
                         pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market AS land_val, pv.market, pp.imprv_type_cd, pv.property_use_cd AS primary_use_code, 
                         pu.property_use_desc AS primary_use_code_desc, dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) AS exemptions
FROM            dbo.property_val AS pv WITH (nolock) INNER JOIN
                         dbo.prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.account AS ac WITH (nolock) ON o.owner_id = ac.acct_id INNER JOIN
                         dbo.address AS a WITH (nolock) ON ac.acct_id = a.acct_id AND ISNULL(a.primary_addr, 0) = 'y' INNER JOIN
                         dbo.property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.prop_val_yr = pta.year AND pv.sup_num = pta.sup_num INNER JOIN
                         dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id INNER JOIN
                         dbo.property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr INNER JOIN
                         dbo.property_use AS pu WITH (nolock) ON pv.property_use_cd = pu.property_use_cd LEFT OUTER JOIN
                         dbo.situs AS s WITH (nolock) ON pv.prop_id = s.prop_id AND ISNULL(s.primary_situs, 'n') = 'y'
where pv.prop_val_yr = (select appr_yr from pacs_system)
and pv.prop_inactive_dt is null

AND (pv.township_code = '10') AND (pv.range_code = '28') AND (pv.township_section <> '31') OR
(pv.prop_val_yr = (select appr_yr from pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '09') AND (pv.range_code = '28') AND (pv.township_section NOT IN ('6', '7', '18')) 
OR
(pv.prop_val_yr = (select appr_yr from pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '08') AND (pv.range_code = '28')AND (pv.township_section BETWEEN '01' AND '12') 
OR
(pv.prop_val_yr = (select appr_yr from pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '08') AND (pv.range_code = '29')AND (pv.township_section BETWEEN '01' AND '12') 
OR
(pv.prop_val_yr = (select appr_yr from pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '09') AND (pv.range_code = '29') AND (pv.township_section IN ('18', '19', '20', '29', '30')) 
OR
(pv.prop_val_yr = (select appr_yr from pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '10') AND (pv.range_code = '27')AND (pv.township_section IN ('01', '02', '11', '12', '13', '14', '24', '25'))
OR
(pv.prop_val_yr = (select appr_yr from pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '11') AND (pv.range_code = '28') AND (pv.township_section IN ('33', '34', '35'))

GO

