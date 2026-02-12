CREATE VIEW [CO\ArcGis].AVMParcelUpdate
AS
SELECT DISTINCT 
                         a.file_as_name AS owner_name, pv.prop_id, p.geo_id, pv.legal_desc,  CONCAT(RTRIM(LTRIM(ad.addr_line1)) + ' ', RTRIM(LTRIM(ad.addr_line2)) + ' ', RTRIM(LTRIM(ad.addr_line3)) + ' ', RTRIM(LTRIM(ad.addr_city)) + ', ', 
                         RTRIM(LTRIM(ad.addr_state)) + ' ', RTRIM(LTRIM(ad.addr_zip)))  AS owner_address,  CONCAT(RTRIM(LTRIM(s.situs_display)) + ' ', 
                         RTRIM(LTRIM(s.situs_city)) + ', ', RTRIM(LTRIM(s.situs_state)) + ' ', RTRIM(LTRIM(s.situs_zip)))  AS situs_address, ta.tax_area_number AS tax_code_area, pv.imprv_hstd_val + pv.imprv_non_hstd_val AS ImpVal, 
                         pv.land_hstd_val + pv.land_non_hstd_val AS LandVal, pv.market AS MarketValue, pv.appraised_val, pv.ag_use_val, hood.hood_name AS neighborhood_name, pv.hood_cd AS neighborhood_code, 
                         pv.legal_acreage AS legal_acres, pp.land_sqft, pp.yr_blt AS year_blt, pp.property_use_cd AS primary_use, pv.cycle
FROM            dbo.property_val AS pv INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id AND p.prop_type_cd = 'r' INNER JOIN
                         dbo.property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.sup_num = pta.sup_num AND pv.prop_val_yr = pta.year INNER JOIN
                         dbo.account AS a WITH (nolock) ON o.owner_id = a.acct_id INNER JOIN
                         dbo.property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr LEFT OUTER JOIN
                         dbo.address AS ad WITH (nolock) ON o.owner_id = ad.acct_id AND ad.primary_addr = 'y' LEFT OUTER JOIN
                         dbo.situs AS s WITH (nolock) ON pv.prop_id = s.prop_id AND s.primary_situs = 'y' LEFT OUTER JOIN
                         dbo.neighborhood AS hood WITH (nolock) ON pv.hood_cd = hood.hood_cd AND pv.prop_val_yr = hood.hood_yr LEFT OUTER JOIN
                         dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id LEFT OUTER JOIN
                         dbo.situs ON pv.prop_id = situs.prop_id
WHERE        (pv.prop_val_yr =
                             (SELECT        appr_yr
                               FROM            dbo.pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.sup_num = 0)

GO

