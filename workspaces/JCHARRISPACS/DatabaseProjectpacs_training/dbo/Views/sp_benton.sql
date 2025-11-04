create view sp_benton

as 



SELECT DISTINCT land.prop_id as ParcelID,  situs.situs_display,  property_val.subset_cd, property_val.last_appraiser_id, land.size_acres as TotalAcres, property_val.market as TotalMarketValue, property_val.assessed_val as TotalAsessedValue, 
property_val.land_hstd_val, property_val.land_non_hstd_val, property_val.land_hstd_val + property_val.land_non_hstd_val as LandVal, property_val.imprv_hstd_val, property_val.imprv_non_hstd_val, property_val.imprv_hstd_val + property_val.imprv_non_hstd_val as ImpVal,
property_val.appraised_val as AppraisedValue, property_val.hood_cd as neighborhood, property_val.township_section, 
property_val.township_code, property_val.range_code, rtrim(replace(property_val.cycle, char(13) + char(10), '')) as Reval, rtrim(replace(property_val.abs_subdv_cd, CHAR(13) + CHAR(10), '-')) as abs_subdv_cd, 
rtrim(replace(abs_subdv.abs_subdv_desc, char(13) + char(10), '')) as abs_subdv_desc, rtrim(property_profile.property_use_cd) as property_use_cd, rtrim(property.prop_type_cd) as prop_type_cd, 
rtrim(land_detail.land_type_cd) as land_type_cd, rtrim(imprv_fix.imprv_type_cd) as PrimaryImprovement, property_val.sub_type, rtrim(imprv_items.RoofCovering) as Roofing, rtrim(imprv_items.HVAC) as Heating, 
rtrim(imprv_items.ExtWall) as ExtWall, rtrim(property.geo_id) as MapNumber, 
rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), '')) as Style, property_profile.living_area as TotalArea, 
rtrim(imprv_fix.actual_year_built) as YearBuilt, 
rtrim(property_profile.condition_cd) as Condition,
imprv_items.Bathrooms, imprv_items.HalfBaths, sum_imprv_areas.attached_garage, sum_imprv_areas.detached_garage,sum_imprv_areas.unfinished_basement as TotalBasementArea, sl_ratio_type_cd, sl_county_ratio_cd,
CONVERT(VARCHAR(10), sales.sl_dt,101) as SaleDate, sales.sl_price as OriginalSalePrice, 
imprv_fix.imprv_val_source, imprv_fix.imp_new_val, imprv_fix.stories, imprv_fix.num_imprv, imprv_fix.imprv_state_cd, imprv_items.Fireplace, imprv_items.Foundation, imprv_items.Fireplace_Cost, imprv_items.FixtureCount_Cost,
property_profile.eff_yr_blt, property_profile.actual_age as Age, property_profile.land_unit_price, property_profile.main_land_unit_price,
rtrim(property_profile.class_cd) as class_cd, rtrim(property_profile.class_cd) + ' ' + rtrim(property_profile.imprv_det_sub_class_cd) as class_subclass_cd,
property_profile.imprv_det_sub_class_cd,  property_profile.percent_complete, property_profile.imprv_unit_price, 
property_profile.heat_ac_code,
property_profile.ls_table as land_table,

imprv_details.unit_price, imprv_details.imprv_det_cost_unit_price, imprv_details.net_rentable_area,
sum_imprv_areas.below_grade_living_area,
land_detail.size_square_feet, land_detail.effective_front,
land_detail.ag_unit_price, land_detail.ag_loss, rtrim(land_detail.land_soil_code) as land_soil_code, land_detail.ag_use_cd,

rtrim(permits.bldg_permit_status) as bldg_permit_status, permits.bldg_permit_issue_dt,
permits.bldg_permit_dt_complete, rtrim(REPLACE(replace(permits.bldg_permit_num, char(10), ''), char(13),'')) as bldg_permit_num, 
rtrim(REPLACE(replace(permits.bldg_permit_desc, char(10), ''), char(13),'')) as bldg_permit_desc, 
rtrim(REPLACE(replace(permits.bldg_permit_cmnt, char(10), ''), char(13),'')) as bldg_permit_cmnt, bldg_permit_active,
images.img_path, coords.XCoord, coords.YCoord


FROM (SELECT prop_id, SUM(size_acres) as size_acres, prop_val_yr FROM land_detail GROUP BY prop_id, prop_val_yr) as land
LEFT JOIN ( SELECT chg_of_owner_prop_assoc.prop_id, sale.sl_price,  sale.sl_ratio_type_cd, sale.sl_county_ratio_cd, sale.sl_dt, ROW_NUMBER() over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id
FROM sale
left JOIN chg_of_owner_prop_assoc ON sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
where chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL AND sl_price > 0 ) as sales ON land.prop_id = sales.prop_id AND sales.order_id = 1
LEFT JOIN property ON land.prop_id = property.prop_id
LEFT JOIN ( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
FROM imprv WHERE imprv.prop_val_yr = (select appr_yr from pacs_system) ) as imprv_fix ON land.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from pacs_system)
LEFT JOIN property_profile ON land.prop_id = property_profile.prop_id AND property_profile.prop_val_yr = (select appr_yr from pacs_system) 
LEFT JOIN property_val ON land.prop_id = property_val.prop_id AND property_val.prop_val_yr = (select appr_yr from pacs_system)
LEFT JOIN ( SELECT [prop_id] ,[prop_val_yr],[imprv_id], sum([unit_price]) as unit_price, sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,sum(net_rentable_area) as net_rentable_area
FROM [pacs_oltp].[dbo].[imprv_detail] GROUP BY prop_id, imprv_id,[prop_val_yr] ) as imprv_details ON imprv_fix.prop_id = imprv_details.prop_id and imprv_fix.prop_val_yr = imprv_details.prop_val_yr and imprv_fix.imprv_id = imprv_details.imprv_id
LEFT JOIN ( SELECT prop_id, imprv_id,
CAST(SUM(below_grade_living_area) AS INT) as below_grade_living_area, 
CAST(SUM(unfinished_basement) AS INT) as unfinished_basement,
CAST(SUM(attached_garage) AS INT) as attached_garage, 
CAST(SUM(detached_garage) AS INT) as detached_garage,
CAST(SUM(carport) AS INT) as carport

FROM ( SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
prop_id, imprv_id, imprv_det_id, CASE WHEN rtrim(imprv_det_desc) = 'Main Area' THEN imprv_det_area ELSE null END AS living_area, 
imprv_detail.imprv_det_type_cd,
CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT' THEN imprv_det_area ELSE null END AS below_grade_living_area, 
CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT' THEN imprv_det_area ELSE null END AS unfinished_basement,
CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR' THEN imprv_det_area ELSE null END AS attached_garage, 
CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR' THEN imprv_det_area ELSE null END AS detached_garage,
CASE WHEN rtrim(imprv_det_type_cd) = 'carport' THEN imprv_det_area ELSE null END AS Carport


FROM imprv_detail WHERE [prop_val_yr] = 2018 AND rtrim(imprv_det_type_cd) IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport') OR rtrim(imprv_det_desc) = 'Main Area' ) as imprv_areas
GROUP BY prop_id, imprv_id  )  as sum_imprv_areas ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id
LEFT JOIN ( SELECT imprv_id, prop_id, prop_val_yr, SUM(CASE WHEN i_attr_val_id = 15 THEN CAST(i_attr_val_cd AS INT) END) as Bedrooms,
Sum(CASE WHEN i_attr_val_id = 45 THEN CAST(i_attr_unit AS INT) END) as Bathrooms,
Sum(CASE WHEN i_attr_val_id = 46 THEN CAST(i_attr_unit AS INT) END) as HalfBaths,
SUM(CASE WHEN i_attr_val_id = 47 THEN CAST(i_attr_unit AS INT) END) as Fixture_Count,

MIN(CASE WHEN i_attr_val_id = 2 THEN i_attr_val_cd END) as Foundation,
MIN(CASE WHEN i_attr_val_id = 3 THEN i_attr_val_cd END) as ExtWall,
MIN(CASE WHEN i_attr_val_id = 6 THEN i_attr_val_cd END) as RoofCovering,
MIN(CASE WHEN i_attr_val_id = 9 THEN i_attr_val_cd END) as HVAC,
MIN(CASE WHEN i_attr_val_id = 10 THEN i_attr_unit END) as Fireplace,
SUM(CASE WHEN i_attr_val_id = 10 THEN imprv_attr_val END) as Fireplace_Cost,
SUM(CASE WHEN i_attr_val_id = 10 THEN imprv_attr_val END) as FixtureCount_Cost
FROM imprv_attr
GROUP BY prop_id, imprv_id, prop_val_yr ) as imprv_items ON imprv_fix.prop_id = imprv_items.prop_id AND imprv_fix.imprv_id = imprv_items.imprv_id AND imprv_items.prop_val_yr = (select appr_yr from pacs_system) 
LEFT JOIN land_detail ON property.prop_id = land_detail.prop_id AND land_detail.prop_val_yr = (select appr_yr from pacs_system)
LEFT JOIN abs_subdv ON property_val.abs_subdv_cd = abs_subdv.abs_subdv_cd
LEFT Join situs on property_val.prop_id=situs.prop_id
LEFT JOIN ( SELECT vw.prop_id, ROW_NUMBER() over (partition by vw.prop_id ORDER BY vw.bldg_permit_id DESC) AS order_id,
vw.bldg_permit_status, vw.bldg_permit_issue_dt, vw.bldg_permit_active, building_permit.bldg_permit_cmnt,
building_permit.bldg_permit_desc, vw.bldg_permit_num, building_permit.bldg_permit_dt_complete
FROM BUILDING_PERMIT_VW as vw
LEFT JOIN building_permit ON vw.bldg_permit_id = building_permit.bldg_permit_id
WHERE prop_id IS NOT NULL ) as permits ON land.prop_id = permits.prop_id AND permits.order_id = 1
LEFT JOIN ( SELECT  row_number() over (partition by prop_id order by id desc) as order_id, prop_id, 
REPLACE( REPLACE( image_path, '\\CHPACS\OLTP\pacs_oltp\Images\',''), '\\CHPACS\OLTP\pacs_oltp\\','') AS img_path
FROM [web_internet_benton].[dbo].[_clientdb_property_image]
WHERE image_type = 'PIC' ) as images ON land.prop_id = images.prop_id AND images.order_id = 1
LEFT JOIN (
SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [Shape_Area] DESC) AS order_id,[Prop_ID],[Geometry].STCentroid().STX as XCoord,[Geometry].STCentroid().STY as YCoord FROM [Benton_spatial_data].[dbo].[Parcel]
) as coords ON land.prop_id = coords.Prop_ID AND coords.order_id = 1
WHERE land.prop_val_yr = (select appr_yr from pacs_system)  AND XCoord IS NOT NULL and property_val.prop_inactive_dt is null

GO

