
create view [dbo].[__PermCrop] as
SELECT DISTINCT 

pv.prop_id as ParcelID,  
rtrim(property.geo_id) as MapNumber, 
a.file_as_name,
situs.situs_display,  

ta.tax_area_description as tax_area,
pv.subset_cd, 

ap.appraiser_full_name as 'next_appraiser', 
ap1.appraiser_full_name as 'last_appraiser'
     ,perm.[order_id]
      ,perm.[imprv_det_] as crop_methood
      ,perm.[imprv_det1] as crop
      ,perm.[imprv_pc_a] as crop_acres
	  ,[Year_Planted] as year_planted

,pv2.imprv_hstd_val + pv2.imprv_non_hstd_val  AS imprv_val_yr_before, 
pv.imprv_hstd_val + pv.imprv_non_hstd_val AS imprv_val_yr_after,  

 CAST(ISNULL(pv.imprv_hstd_val + pv.imprv_non_hstd_val, 0) - ISNULL(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val, 0)  
 AS numeric(18, 4)) / (CASE WHEN  pv2.imprv_hstd_val + pv2.imprv_non_hstd_val IS NULL 

THEN 1 WHEN pv2.imprv_hstd_val + pv2.imprv_non_hstd_val = 0  

THEN 1 ELSE pv2.imprv_hstd_val + pv2.imprv_non_hstd_val END) * 100/100 as imprv_percent_change,

pv2.land_hstd_val + pv2.land_non_hstd_val  AS land_val_yr_before, 
pv.land_hstd_val + pv.land_non_hstd_val AS land_val_yr_after, 

CAST(ISNULL(pv.land_hstd_val + pv.land_non_hstd_val, 0) - ISNULL(pv2.land_hstd_val + pv2.land_non_hstd_val, 0) 
AS numeric(18, 4))
 / 
(CASE WHEN  pv2.land_hstd_val + pv2.land_non_hstd_val IS NULL 
THEN 1 WHEN pv2.land_hstd_val + pv2.land_non_hstd_val = 0  
THEN 1 ELSE pv2.land_hstd_val + pv2.land_non_hstd_val END) * 100/100 as land_percent_change,
convert(varchar (20), sl_dt, 101)	  as SaleDate,
sales.sl_price as OriginalSalePrice, 
sales.excise_number,
sales.deed_type_cd,
pv.legal_acreage as TotalAcres,
pv.market as TotalMarketValue, 
pv2.market as PreviousMarket,
pv.assessed_val as TotalAsessedValue, 
pv2.assessed_val as PreviousAsessedValue,
pv.land_hstd_val + pv.land_non_hstd_val as LandVal, 
pv2.land_hstd_val + pv2.land_non_hstd_val as PreviousLandVal,

pv.imprv_hstd_val + pv.imprv_non_hstd_val as ImpVal,
pv2.imprv_hstd_val + pv2.imprv_non_hstd_val as PreviousImpVal,
pv.appraised_val as AppraisedValue, 
pv2.appraised_val as PreviousAppraisedValue,
imprv_details.new_value, 
pv.hood_cd as neighborhood, 
pv.township_section as section, 
pv.township_code as township, 
pv.range_code as range,
pv.legal_acreage as legal_acres,
pp.land_sqft as land_sqft,
pp.zoning,
pp.land_front_feet,
rtrim(replace(pv.cycle, char(13) + char(10), '')) as Reval,
rtrim(replace(pv.abs_subdv_cd, CHAR(13) + CHAR(10), '-')) as abs_subdv_cd, 
rtrim(replace(abs_subdv.abs_subdv_desc, char(13) + char(10), '')) as abs_subdv_desc,
rtrim(pp.property_use_cd) as property_use_cd,
rtrim(property.prop_type_cd) as prop_type_cd, 
rtrim(imprv_fix.imprv_type_cd) as PrimaryImprovement,
pv.sub_type,
rtrim(imprv_items.RoofCovering) as Roofing, 
rtrim(imprv_items.HVAC) as Heating, 
rtrim(imprv_items.ExtWall) as ExtWall,
rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), '')) as Style, 
pp.living_area as TotalArea, 
rtrim(imprv_fix.actual_year_built) as YearBuilt, 
rtrim(pp.condition_cd) as Condition,
imprv_items.Bathrooms, 
imprv_items.HalfBaths, 
sum_imprv_areas.attached_garage, 
sum_imprv_areas.detached_garage,
sum_imprv_areas.finished_basement,
sum_imprv_areas.unfinished_basement,
CAST(ISNULL(sum_imprv_areas.finished_basement, 0) + ISNULL(sum_imprv_areas.unfinished_basement, 0) 
                         AS numeric(18, 0)) as Total_Basement,
sum_imprv_areas.carport,
sum_imprv_areas.Pole_building,
sl_ratio_type_cd, 
sl_county_ratio_cd,
adjusted_sl_price,
chg_of_owner_id,
land_only_sale,
sl_land_unit_price,
sl_type_cd,

imprv_fix.imprv_val_source, 
imprv_fix.imp_new_val AS new_val, 
imprv_fix.stories as stories, 
imprv_fix.num_imprv as num_imprv, 
imprv_fix.imprv_state_cd, 
imprv_items.Fireplace as fireplace, 
imprv_items.Foundation as foundation, 
imprv_items.Fireplace_Cost as fireplace_count, 
imprv_items.FixtureCount_Cost as FixtureCount_Cost,
pp.eff_yr_blt,
pp.actual_age as Age,
pp.land_unit_price, 
pp.main_land_unit_price,
rtrim(pp.class_cd) as class_cd,
rtrim(pp.class_cd) + ' ' + rtrim(pp.imprv_det_sub_class_cd) as class_subclass_cd,

rtrim(pp2.class_cd) + ' ' + rtrim(pp2.imprv_det_sub_class_cd) as pre_subclass_cd,
 
pp.percent_complete, 
pp.imprv_unit_price, 
pp.heat_ac_code,
pp.ls_table as land_table,
imprv_details.unit_price as details_unit_price, 
imprv_details.imprv_det_cost_unit_price, 
imprv_details.net_rentable_area,
rtrim(permits.bldg_permit_status) as permit_status, 
permits.bldg_permit_issue_dt as permit_issue_date,
permits.bldg_permit_dt_complete as permit_complete_date, 
rtrim(REPLACE(replace(permits.bldg_permit_num, char(10), ''), char(13),'')) as permit_num, 
rtrim(REPLACE(replace(permits.bldg_permit_desc, char(10), ''), char(13),'')) as permit_desc, 
rtrim(REPLACE(replace(permits.bldg_permit_cmnt, char(10), ''), char(13),'')) as permit_cmnt, 
bldg_permit_active as active_permits,
images.img_path, 
coords.XCoord,
coords.YCoord
,x
,y


FROM 

(SELECT prop_id, SUM(size_acres) as size_acres, 
prop_val_yr 
FROM land_detail
 GROUP BY prop_id, 
 prop_val_yr) as land


LEFT JOIN 

(SELECT chg_of_owner_prop_assoc.prop_id, 
sale.sl_price,  
sale.sl_ratio_type_cd, 
sale.sl_county_ratio_cd, 
sale.sl_dt, 
sale.adjusted_sl_price,
sale.chg_of_owner_id,
sale.land_only_sale,
sale.sl_qualifier,
sale.sl_land_unit_price,
sale.sl_type_cd,
chg_of_owner.excise_number,
chg_of_owner.deed_type_cd,

ROW_NUMBER() 
over (partition by chg_of_owner_prop_assoc.prop_id 
ORDER BY sl_dt DESC) AS order_id

FROM 

sale

left JOIN 

chg_of_owner_prop_assoc 

ON sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
 left join 
 
 chg_of_owner
 on 
chg_of_owner.chg_of_owner_id=chg_of_owner_prop_assoc.chg_of_owner_id


where 

chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL 
AND sl_price > 0 ) as sales 


ON 

land.prop_id = sales.prop_id 

AND sales.order_id = 1

LEFT JOIN property 

ON 

land.prop_id = property.prop_id

LEFT JOIN 

( SELECT *, 
ROW_NUMBER() 
OVER 
(PARTITION BY prop_id 
ORDER BY imprv_val DESC) AS row_id 

FROM imprv 

WHERE imprv.prop_val_yr = 

(select appr_yr from pacs_system) ) 

as imprv_fix 

ON 

land.prop_id = imprv_fix.prop_id 

AND imprv_fix.row_id = 1 

AND imprv_fix.prop_val_yr = 

(select appr_yr 
from pacs_system)

LEFT JOIN 

property_profile pp

ON 

land.prop_id = pp.prop_id 

AND pp.prop_val_yr = 

(select appr_yr from pacs_system) 

LEFT JOIN 

property_profile pp2

ON 

land.prop_id = pp2.prop_id 

AND pp2.prop_val_yr = 

(select tax_yr from pacs_system) 

LEFT JOIN 

property_val pv

ON 

land.prop_id = pv.prop_id 

AND pv.prop_val_yr = 

(select appr_yr from pacs_system)

 left join 

appraiser ap on 
    pv.last_appraiser_id = ap.appraiser_id

left  join appraiser ap1 on
    pv.last_appraiser_id = ap1.appraiser_id

LEFT JOIN 

property_val pv2

ON 

land.prop_id = pv2.prop_id 

AND pv2.prop_val_yr = (select tax_yr 
from pacs_system)



LEFT JOIN 

(SELECT [prop_id] ,
[prop_val_yr],
[imprv_id], 
sum([unit_price]) as unit_price, 
sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,
sum(net_rentable_area) as net_rentable_area,

sum(new_value) as new_value



FROM 
[pacs_oltp].[dbo].[imprv_detail] 

GROUP BY prop_id, 
imprv_id,
[prop_val_yr] ) as imprv_details 

ON imprv_fix.prop_id = imprv_details.prop_id 

and imprv_fix.prop_val_yr = imprv_details.prop_val_yr 

and imprv_fix.imprv_id = imprv_details.imprv_id

LEFT JOIN

(SELECT prop_id, 
imprv_id,
CAST(SUM(finished_basement) AS INT) as finished_basement, 
CAST(SUM(unfinished_basement) AS INT) as unfinished_basement,
CAST(SUM(attached_garage) AS INT) as attached_garage, 
CAST(SUM(detached_garage) AS INT) as detached_garage,
CAST(SUM(carport) AS INT) as carport,
CAST(SUM(carport) AS INT) as Pole_building

FROM 

(SELECT 
row_number() 
over (partition by prop_id 
order by "imprv_id" ASC) as "num", 
prop_id, 
imprv_id, 
imprv_det_id, 

CASE WHEN rtrim(imprv_det_desc) = 'Main Area' THEN imprv_det_area ELSE null END AS living_area, 
imprv_detail.imprv_det_type_cd,
CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT' THEN imprv_det_area ELSE null END AS finished_basement, 
CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT' THEN imprv_det_area ELSE null END AS unfinished_basement,
CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR' THEN imprv_det_area ELSE null END AS attached_garage, 
CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR' THEN imprv_det_area ELSE null END AS detached_garage,
CASE WHEN rtrim(imprv_det_type_cd) = 'carport' THEN imprv_det_area ELSE null END AS Carport,
CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg' THEN imprv_det_area ELSE null END AS Pole_building

FROM imprv_detail 

WHERE
[prop_val_yr] = (select appr_yr 
from pacs_system)

AND rtrim(imprv_det_type_cd) 

IN ('MA', 
'BSMT', 
'ATTGAR', 
'DETGAR', 
'U-BSMT',
'carport',
'polebldg' ) 

OR 

rtrim(imprv_det_desc) = 
'Main Area' ) as imprv_areas

GROUP BY prop_id, 
imprv_id )  as sum_imprv_areas 

ON 

imprv_fix.prop_id = sum_imprv_areas.prop_id 
AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id

LEFT JOIN 

(SELECT imprv_id, 
prop_id, 
prop_val_yr, 
SUM(CASE WHEN i_attr_val_id = 15 THEN CAST(i_attr_val_cd AS INT) END) as Bedrooms,
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

GROUP BY 
prop_id, 
imprv_id, 
prop_val_yr ) as imprv_items 

ON 

imprv_fix.prop_id = imprv_items.prop_id 
AND imprv_fix.imprv_id = imprv_items.imprv_id 
AND imprv_items.prop_val_yr = 

(select appr_yr 
from pacs_system) 

LEFT JOIN 

land_detail 

ON 
property.prop_id = land_detail.prop_id 
AND land_detail.prop_val_yr = 

(select appr_yr 
from pacs_system)

LEFT JOIN 

abs_subdv 

ON pv.abs_subdv_cd = abs_subdv.abs_subdv_cd

LEFT Join 

situs 

on pv.prop_id=situs.prop_id

left join
owner o
on 
   pv.prop_id = o.prop_id
      and pv.prop_val_yr = o.owner_tax_yr
      and pv.sup_num = o.sup_num

	  inner  join

	  account a

	  on 
	  o.owner_id=a.acct_id

LEFT JOIN 

(SELECT vw.prop_id, 
ROW_NUMBER() over 
(partition by vw.prop_id 
ORDER BY vw.bldg_permit_id DESC) 

AS order_id,

vw.bldg_permit_status, 
vw.bldg_permit_issue_dt, 
vw.bldg_permit_active, 
building_permit.bldg_permit_cmnt,
building_permit.bldg_permit_desc, 
vw.bldg_permit_num, 
building_permit.bldg_permit_dt_complete

FROM BUILDING_PERMIT_VW as vw

LEFT JOIN building_permit 

ON vw.bldg_permit_id = building_permit.bldg_permit_id

WHERE 
prop_id IS NOT NULL ) as permits 

ON land.prop_id = permits.prop_id 
AND permits.order_id = 1

LEFT JOIN 

wash_prop_owner_tax_area_assoc AS wta WITH (nolock) ON wta.year = pv.prop_val_yr AND wta.prop_id = pv.prop_id AND wta.sup_num = pv.sup_num 

left join
tax_area AS ta WITH (nolock) ON ta.tax_area_id = wta.tax_area_id
left join
(SELECT  row_number() 
over 
(partition by prop_id order by id desc) as order_id, 
prop_id, 

REPLACE( REPLACE( image_path, '\\CHPACS\OLTP\pacs_oltp\Images\',''), 
'\\CHPACS\OLTP\pacs_oltp\\','') AS img_path

FROM 

[web_internet_benton].[dbo].[_clientdb_property_image]

WHERE 

image_type = 'PIC' ) 
as images 

ON land.prop_id = images.prop_id 

AND images.order_id = 1

LEFT JOIN 

Benton_spatial_data.dbo.perm_crop as perm on perm.prop_id=pv.prop_id

left join 
[Benton_spatial_data].[dbo].[__permcrop_view] as pd on pd.prop_id=pv.prop_id

left join 
(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
--Geometry,
[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord ,

      [CENTROID_X] as x
      ,[CENTROID_Y] as y

FROM 
[Benton_spatial_data].[dbo].[spatial_coords]
--[Benton_spatial_data].[dbo].[parcel]
) as coords
 
ON 

land.prop_id = coords.Prop_ID AND coords.order_id = 1

WHERE 

land.prop_val_yr = 
(select appr_yr  from pacs_system)  
and (imprv_fix.imprv_type_cd)='permc'

GO

