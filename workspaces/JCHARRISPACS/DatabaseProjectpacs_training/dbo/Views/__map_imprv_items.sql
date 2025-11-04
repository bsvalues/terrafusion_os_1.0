create view  __map_imprv_items as

SELECT 
imprv_id, 
prop_id,
SUM(CASE WHEN i_attr_val_id = 15 AND i_attr_val_cd <> 'Count'
THEN CAST(i_attr_val_cd AS int) ELSE NULL END) 						AS bedrooms_1,
SUM(CASE WHEN i_attr_val_id = 15 THEN i_attr_unit ELSE NULL END)	AS bedrooms,
SUM(CASE WHEN i_attr_val_id = 45 THEN i_attr_unit ELSE NULL END) 	AS baths,
SUM(CASE WHEN i_attr_val_id = 46 THEN i_attr_unit ELSE NULL END) 	AS halfbath,
MIN(CASE WHEN i_attr_val_id = 2 THEN i_attr_val_cd ELSE NULL END) 	AS foundation,
MIN(CASE WHEN i_attr_val_id = 3 THEN i_attr_val_cd ELSE NULL END) 	AS extwall_desc,
MIN(CASE WHEN i_attr_val_id = 6 THEN i_attr_val_cd ELSE NULL END)	AS roofcover_desc,
MIN(CASE WHEN i_attr_val_id = 9 THEN i_attr_val_cd ELSE NULL END)	AS hvac_desc,
SUM(CASE WHEN i_attr_val_id = 10 THEN i_attr_unit ELSE NULL END) 	AS fireplaces,
MIN(CASE WHEN i_attr_val_id = 12 THEN i_attr_val_cd ELSE NULL END) 	AS sprinkler,
MIN(CASE WHEN i_attr_val_id = 39 THEN i_attr_val_cd ELSE NULL END) 	AS framing_class,
MIN(CASE WHEN i_attr_val_id = 31 THEN i_attr_val_cd ELSE NULL END)	AS com_hvac
FROM
 imprv_attr
WHERE 
prop_val_yr = (select appr_yr from pacs_system)and sale_id = 0
GROUP BY imprv_id, prop_id, imprv_id

GO

