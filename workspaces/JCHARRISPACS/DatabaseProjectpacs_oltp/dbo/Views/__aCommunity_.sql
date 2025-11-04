
Create view __aCommunity_ as


SELECT property_val.prop_id, REPLACE(coalesce(block, ''), '\"', '') as block, coalesce(tract_or_lot, '') as tract_or_lot, 
Replace(ltrim(rtrim(legal_desc)), '\"', '') as legal_desc, Replace(rtrim(coalesce(legal_desc_2, '')), '\"', '') as legal_desc_2, 
township_section, township_code, range_code, 
coalesce(township_q_section, '') as township_q_section,
cycle, property_val.property_use_cd, property_use.property_use_desc, last_year_vals.market, 
last_year_vals.land_hstd_val,last_year_vals.land_non_hstd_val, last_year_vals.imprv_hstd_val, last_year_vals.imprv_non_hstd_val,
hood_cd, coalesce(REPLACE(REPLACE(abs_subdv_cd, CHAR(13), ''),CHAR(10), ' '), '') as abs_subdv_cd, 
last_year_vals.appraised_val, last_year_vals.assessed_val, legal_acreage, rtrim(property.prop_type_cd) as prop_type_cd,
replace(image_path, '\\CHPACS\OLTP\pacs_oltp\Images\' ,'') as image_path, property.geo_id,
case when prop_inactive_dt IS NULL THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS isactive, ROW_NUMBER() OVER(partition by property_val.prop_id ORDER BY sup_num desc) AS RowNum
FROM property_val


LEFT JOIN property_use ON property_val.property_use_cd = property_use.property_use_cd
LEFT JOIN property ON property_val.prop_id = property.prop_id
LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
 [Shape].STCentroid().STX as XCoord,[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON property_val.prop_id = coords.Prop_ID AND coords.order_id = 1
LEFT JOIN (SELECT prop_id, market,land_hstd_val,land_non_hstd_val, imprv_hstd_val, imprv_non_hstd_val, appraised_val, assessed_val, 
ROW_NUMBER() OVER(partition by property_val.prop_id ORDER BY sup_num desc) AS RowNum
FROM property_val 			
WHERE prop_val_yr = (select appr_yr from pacs_system) 
) AS last_year_vals ON property_val.prop_id = last_year_vals.prop_id AND last_year_vals.RowNum = 1
where prop_val_yr = (select appr_yr from pacs_system)

GO

