create view  __map_imprv_detail as 

WITH below_grade as ( SELECT imprv_id, CASE WHEN imprv_det_type_cd = 'BSMT' THEN imprv_det_area END 						as below_grade_living_area
FROM
imprv_detail
 WHERE 
imprv_detail.prop_val_yr = (select appr_yr from pacs_system) and sale_id = 0)
SELECT DISTINCT
imprv_detail.prop_id,
imprv_detail.imprv_id, 
CASE WHEN imprv_det_type_cd = 
'MA' THEN imprv_det_area END 					as living_area,
below_grade.below_grade_living_area,
condition_cd, 
imprv_det_sub_class_cd, 
 yr_built,
actual_age, 
num_stories, 
imprv_det_type_cd,
rtrim(REPLACE(REPLACE(imprv_det_desc, CHAR(13), ''),CHAR(10), ' ')) 	AS imprv_det_desc,
imprv_det_area, 
rtrim(imprv_det_class_cd) 						as imprv_det_class_cd
FROM 
imprv_detail
LEFT JOIN 
below_grade ON imprv_detail.imprv_id = below_grade.imprv_id
WHERE 
imprv_detail.prop_val_yr = (select appr_yr from pacs_system) and sale_id = 0 and imprv_det_type_cd='ma'

GO

