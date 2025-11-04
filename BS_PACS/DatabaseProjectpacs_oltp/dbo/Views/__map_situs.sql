create view  __map_situs as 
SELECT prop_id, situs_num, rtrim(situs_street_prefx)				as situs_street_prefx, 
rtrim(situs_street) 												as situs_street,
rtrim(situs_street_sufix)											as situs_street_sufix,
situs_unit,
rtrim(situs_city) 													as situs_city,
situs_state,
situs_zip, 
rtrim(REPLACE(REPLACE(situs_display, CHAR(13), ''),CHAR(10), ' ')) 	as situs_display
FROM 
situs
WHERE 
primary_situs = 'Y'

GO

