create view  __map_imprv as

WITH imprv_living_area as (
SELECT prop_id, imprv_id, sum(imprv_det_area)			 AS living_area 
FROM 
imprv_detail 
WHERE 
imprv_det_type_cd = 
'MA' AND prop_val_yr = (select appr_yr from pacs_system) AND sale_id = 0
GROUP BY prop_id, imprv_id
)
select imprv.prop_id, imprv.imprv_id, REPLACE(REPLACE(imprv_desc, CHAR(13), ''),CHAR(10), ' ') AS imprv_desc, 
imprv_val, imprv_living_area.living_area, imprv.primary_use_cd, stories, actual_year_built
FROM imprv
LEFT JOIN imprv_living_area ON imprv.imprv_id = imprv_living_area.imprv_id
WHERE prop_val_yr = (select appr_yr from pacs_system) AND sale_id = 0 --and imprv_det_type_cd='ma'

GO

