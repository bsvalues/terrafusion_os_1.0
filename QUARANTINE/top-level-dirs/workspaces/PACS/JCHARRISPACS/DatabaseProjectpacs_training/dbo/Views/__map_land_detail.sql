create view  __map_land_detail as

SELECT prop_id,
size_acres, 
size_square_feet, 
land_type_cd, 
[szLandSoilDesc] 						AS land_soil_code,
ag_use_cd,
primary_use_cd
FROM
land_detail
left join 
[land_soil] 
ON 
LAND_DETAIL.land_soil_code = LAND_SOIL.[szLandSoilCode]
WHERE
prop_val_yr = (select appr_yr from pacs_system) and sale_id = 0

GO

