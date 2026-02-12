


create view [dbo].[property_use_val_1] as 

SELECT property_val.prop_id, REPLACE(coalesce(block, ''), '\"', '') as block, coalesce(tract_or_lot, '') as tract_or_lot, 
Replace(ltrim(rtrim(legal_desc)), '\"', '') as legal_desc, Replace(rtrim(coalesce(legal_desc_2, '')), '\"', '') as legal_desc_2, 
township_section, township_code, range_code, 
coalesce(township_q_section, '') as township_q_section,
cycle, property_val.property_use_cd, property_use.property_use_desc, market, 
land_hstd_val,
land_non_hstd_val, imprv_hstd_val, imprv_non_hstd_val,
hood_cd, coalesce(REPLACE(REPLACE(abs_subdv_cd, CHAR(13), ''),CHAR(10), ' '), '') as abs_subdv_cd, 
appraised_val, assessed_val, legal_acreage, rtrim(property.prop_type_cd) as prop_type_cd,
replace(image_path, '\\CHPACS\OLTP\pacs_oltp\Images\' ,'') as image_path, property.geo_id,
case when prop_inactive_dt IS NULL THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS isactive


FROM pacs_oltp.dbo.property_val
LEFT JOIN pacs_oltp.dbo.property_use ON property_val.property_use_cd = property_use.property_use_cd
LEFT JOIN pacs_oltp.dbo.property ON property_val.prop_id = property.prop_id

--ORDER BY prop_id

GO

