create view __Oliver_Analysis as 
SELECT DISTINCT 
pv.prop_id																															as ParcelID,  
rtrim(property.geo_id)																												as ParcelNumber,

pv.map_id,
pv.prop_val_yr																														as RollYear,
pv.prop_inactive_dt																													as Inactive_Parcel,
rtrim(pp.property_use_cd)																											as DORCode,
pv.legal_acreage																													as TotalAcres,
ta.tax_area_description																												as tax_area,
rtrim(replace(pv.cycle, char(13) + char(10), ''))																					as Reval,
pv.hood_cd																															as neighborhood, 
rtrim(replace(abs_subdv.abs_subdv_desc, char(13) + char(10), ''))																	as Subdivision,
situs.situs_display																													as 'address', 
pv.legal_desc																														as legal_desc,
convert(varchar (20), sl_dt, 101)																									as SaleDate,
sales.sl_price																														as OriginalSalePrice, 
adjusted_sl_price																													as adjusted_sl_price,
rtrim(imprv_fix.imprv_type_cd)																										as PrimaryImprovement,
prop_count																															as sl_prop_count,
      [total_land_market]																											as sl_total_land_market
      ,[total_imp_market]																											as sl_total_imprv_market
      ,[total_market]																												as sl_total_market
      ,[total_ag_use]																												as sl_ag_use
      ,[total_ag_market]																											as sl_ag_market
      ,[total_acres]																												as sl_total_acres,
case when pv.market <> 0  and sales.sl_price > 0 then CAST(ROUND((pv.market / sales.sl_price), 2) 	as decimal(10, 2)) else 0 end	as 'Ratio',
--CASE ISNULL(pp.living_area,0)WHEN 0 THEN 0 ELSE ( pp.land_total_sqft / pp.living_area)	END											AS  land_building_ratio,

RTRIM(COALESCE(deed_history.grantee, ''))																							AS grantee, 
RTRIM(COALESCE(deed_history.grantor, ''))																							as grantor,
sales.deed_type_cd																													as DeedType,
sales.excise_number																													as ExciseAffidavit,
land.state_cd,
YEAR(sl_dt)																							as sl_year,
MONTH(sl_dt)																						as sl_month,
RTRIM(COALESCE(sl_county_ratio_cd, '' ))															as LocalQual,
RTRIM(COALESCE(sl_ratio_type_cd, '' ))																AS StateQual, 
sales.comment																						as SaleNote,
sales.sl_adj_rsn																					as sl_adjustment_reason,
land_only_sale																						as UnimprovedSale,
sales.sl_land_type_cd,														
sales.sl_qualifier,
sales.pers_prop_val,
sales.sl_type_cd,
sl_county_ratio_cd,
rtrim(property.prop_type_cd)																														as prop_type_cd, 
imprv_fix.stories																																	as stories, 
imprv_fix.num_imprv																																	as num_imprv, 
pp.living_area																																		as TotalArea, 
sum_imprv_areas.finished_basement																													as finished_basement,
sum_imprv_areas.unfinished_basement																													as unfinished_basement,
CAST(ISNULL(sum_imprv_areas.finished_basement, 0) + ISNULL(sum_imprv_areas.unfinished_basement, 0)  AS numeric(18, 0))								as Total_Basement,

rtrim(imprv_fix.imprv_type_cd)																														as ImpType,
rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), ''))																			as Style, 
pp.actual_age																																		as Age,
rtrim(imprv_fix.actual_year_built)																													as YearBuilt, 
rtrim(pp.class_cd)																																	as class_cd,
rtrim(pp.class_cd) + ' ' + rtrim(pp.imprv_det_sub_class_cd)																							as Quality,
rtrim(pp.condition_cd)																																as Condition,
pp.eff_yr_blt																																		as EffectiveAge, 
sum_imprv_areas.attached_garage																														as attached_garage, 
attached_garage_Count, 
sum_imprv_areas.detached_garage																														as detached_garage,
detached_garage_Count, 
sum_imprv_areas.carport																																as carport,
carport_Count,
Pole_building_Count	,
sum_imprv_areas.Pole_building																														as Pole_building,
rtrim(imprv_items.RoofCovering)																														as Roofing, 
rtrim(imprv_items.HVAC)																																as Heating, 
rtrim(imprv_items.ExtWall)																															as ExtWall,
rtrim(imprv_items.SolarPanels)																														as SolarPanels,
imprv_items.Bathrooms																																as Bathrooms, 
imprv_items.HalfBaths																																as HalfBaths, 
imprv_items.Fireplace																																as fireplace, 
imprv_items.Foundation																																as foundation,
imprv_items.Comm_frame																												as Commercial_frame,
imprv_items.COMM_Shape																												as Commercial_Shape,
imprv_items.COMM_Units																												as Commercial_Units,
imprv_items.COMM_Tank_Type																											as Commercial_Tank_Type,
imprv_items.COMM_Tank_Capacity																										as Commercial_Tank_Capacity,
imprv_items.COMM_Service_Pit																										as Commercial_Service_Pit,
imprv_items.COMM_HVAC																												as Commercial_HVAC,
imprv_items.COMM_Elevators																											as Commercial_Elevators,
imprv_items.Comm__Sprinkler																											as Commercial_Sprinkler,
lands.Range_land,
lands.Rural_Homesite,
lands.AG1SITE,
lands.Columbia_river_AG1_Site,
lands.Dry_agland,
lands.Dry_Pasture,
lands.Dry_Pasture_Norm,
lands.Badger_Irr,
lands.Columbia_river,
lands.Irrigated_agland,
lands.BMDRP,
lands.Well_circle,
lands.Red_Mountain,
lands.FROS,
lands.Waste,
lands.OpenSpace_OpenSpace,

pp.land_sqft																																		as land_sqft,
imprv_details.imprv_det_cost_unit_price																												as imprv_details_unit_cost, 
imprv_details.unit_price																															as details_unit_price, 
pp.imprv_unit_price																																	as imprv_unit_price, 
sl_imprv_unit_price																																	as sl_imprv_unit_price,
sl_land_unit_price																																	as sl_land_unit_price,
pp.land_unit_price																																	as land_unit_price, 
imprv_fix.imp_new_val																																AS new_val, 
imprv_details.new_value																																as imprv_details_new_val,
pv2.market																																			as PreviousMarket,	
pv.market																																			as TotalMarket,
pv2.assessed_val																																	as PreviousAsessedValue,
pv.assessed_val																																		as TotalAsessedValue, 
rtrim(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val)																									AS PreviousImpVal, 
rtrim(pv.imprv_hstd_val + pv.imprv_non_hstd_val)																									as ImpVal,
pv2.land_hstd_val + pv2.land_non_hstd_val																											as PreviousLandVal,
pv.land_hstd_val + pv.land_non_hstd_val																												as LandVal,
	CASE ISNULL(pp.land_total_sqft,0)WHEN 0 THEN 0	ELSE ( land_seg_mkt_val ) / pp.land_total_sqft	END												AS value_land_per_sqft,
	CASE ISNULL(pp.land_total_sqft,0)WHEN 0 THEN 0	ELSE ( sl_land_unit_price) / pp.land_total_sqft	END												AS sl_land_per_sqft,
	CASE ISNULL(pp.land_total_acres,0)WHEN 0 THEN 0	ELSE ( land_seg_mkt_val ) / pp.land_total_acres	END												AS value_land_per_acre,
	CASE ISNULL(pp.land_total_acres,0)WHEN 0 THEN 0	ELSE ( sl_land_unit_price ) / pp.land_total_acres	END											AS sl_land_per_acre,

CAST(ISNULL(pv.imprv_hstd_val + pv.imprv_non_hstd_val, 2) - ISNULL(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val, 2)  
AS decimal(10, 2)) / (CASE WHEN  pv2.imprv_hstd_val + pv2.imprv_non_hstd_val IS NULL
THEN 1 WHEN pv2.imprv_hstd_val + pv2.imprv_non_hstd_val = 0  THEN 1 ELSE pv2.imprv_hstd_val + pv2.imprv_non_hstd_val END ) * 100/100				as imprv_percent_change,
CAST(ISNULL(pv.land_hstd_val + pv.land_non_hstd_val, 2) - ISNULL(pv2.land_hstd_val + pv2.land_non_hstd_val, 2) 
AS decimal(10, 2))/ (CASE WHEN  pv2.land_hstd_val + pv2.land_non_hstd_val IS NULL THEN 1 WHEN pv2.land_hstd_val + pv2.land_non_hstd_val = 0  
THEN 1 ELSE pv2.land_hstd_val + pv2.land_non_hstd_val END) * 100/100																				as land_percent_change,

pp.percent_complete																																	as percent_complete,
rtrim(permits.bldg_permit_status)																													as permit_status, 
--permits.bldg_permit_dt_complete																													as permit_complete_date, 
convert(varchar (20), permits.bldg_permit_dt_complete	, 101)																						as permit_complete_date,

ap.appraiser_full_name																																as 'next_appraiser', 
ap1.appraiser_full_name																																as 'last_appraiser',


images.img_path, 
coords.XCoord,
coords.YCoord
,x
,y
--imprv_details.unit_price																			as details_unit_price, 
--pp.imprv_unit_price																				as imprv_unit_price, 
--pp.heat_ac_code																					as heat_ac_code,
--
--imprv_fix.imprv_val_source																		as imprv_val_source, 
--imprv_fix.imprv_state_cd																			as imprv_state_cd, 
--imprv_items.FixtureCount_Cost																		as FixtureCount_Cost,
--imprv_items.Fireplace_Cost																		as fireplace_count, 
--a.file_as_name																					as file_as_name,
--pv.sub_type																						as sub_type,
--adjusted_sl_price																					as adjusted_sl_price,
--chg_of_owner_id,

--pp.main_land_unit_price																			as main_land_unit_price,
--pp.ls_table																						as land_table,

--pv.subset_cd, 


--rtrim(REPLACE(replace(permits.bldg_permit_num, char(10), ''), char(13),''))						as permit_num, 
--rtrim(REPLACE(replace(permits.bldg_permit_desc, char(10), ''), char(13),''))						as permit_desc, 
--rtrim(REPLACE(replace(permits.bldg_permit_cmnt, char(10), ''), char(13),''))						as permit_cmnt, 
--pv2.imprv_hstd_val + pv2.imprv_non_hstd_val														as PreviousImpVal,
--pv.appraised_val																					as AppraisedValue, 
--pv2.appraised_val																					as PreviousAppraisedValue,
--imprv_details.new_value, 

--pv.township_section																				as section, 
--pv.township_code																					as township, 
--pv.range_code																						as range,
--pv.legal_acreage																					as legal_acres,
--pp.zoning,
--pp.land_front_feet,

--rtrim(replace(pv.abs_subdv_cd, CHAR(13) + CHAR(10), '-'))											as abs_subdv_cd, 

--bldg_permit_active as active_permits,
FROM 

(SELECT prop_id, SUM(size_acres) as size_acres, 
state_cd,
prop_val_yr 
FROM land_detail
 GROUP BY prop_id, state_cd,
 prop_val_yr) as land
 left join
 (SELECT prop_id, prop_val_yr, SUM(size_acres) as size_acres, 
MIN(CASE WHEN land_soil_code like'range' THEN land_soil_code END) as 'Range_land',
MIN(CASE WHEN land_soil_code like 'DRAG%' THEN land_soil_code END) as 'Dry_agland',
MIN(CASE WHEN land_soil_code like 'BMIA%' THEN land_soil_code END) as 'Badger_Irr',
MIN(CASE WHEN land_soil_code like 'CRIA%' THEN land_soil_code END) as 'Columbia_river',

MIN(CASE WHEN land_soil_code like 'IRAG%' THEN land_soil_code END) as 'Irrigated_agland',
MIN(CASE WHEN land_soil_code like 'DRPA%' THEN land_soil_code END) as 'Dry_Pasture',
MIN(CASE WHEN land_soil_code like 'RHS%' THEN land_soil_code END) as 'Rural_Homesite',
MIN(CASE WHEN land_soil_code like 'BMDRP%' THEN land_soil_code END) as 'BMDRP',
MIN(CASE WHEN land_soil_code like 'WCIA1%' THEN land_soil_code END) as 'Well_circle',
MIN(CASE WHEN land_soil_code like 'RMIA%' THEN land_soil_code END) as 'Red_Mountain',
MIN(CASE WHEN land_soil_code like 'WASTE%' THEN land_soil_code END) as 'Waste',

MIN(CASE WHEN land_soil_code like 'SITE%' THEN land_soil_code END) as 'AG1SITE',
MIN(CASE WHEN land_soil_code like 'SITC%' THEN land_soil_code END) as 'Columbia_river_AG1_Site',
MIN(CASE WHEN land_soil_code like 'FROS%' THEN land_soil_code END) as 'FROS',
MIN(CASE WHEN land_soil_code like 'OSOS%' THEN land_soil_code END) as 'OpenSpace_OpenSpace',
MIN(CASE WHEN land_soil_code like 'DRPNV%' THEN land_soil_code END) as 'Dry_Pasture_Norm'


FROM land_detail

 GROUP BY prop_id, 
 prop_val_yr) as lands
 on lands.prop_id=land.prop_id
 and lands.prop_val_yr=land.prop_val_yr



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
sale.pers_prop_val,
sale.sl_adj_rsn,
sale.sl_land_type_cd,
chg_of_owner.excise_number,
chg_of_owner.deed_type_cd,
chg_of_owner.comment,
chg_of_owner.consideration,
chg_of_owner.deed_num,
chg_of_owner.deed_book_page,
chg_of_owner.grantee_cv,
chg_of_owner.grantor_cv,
sl_imprv_unit_price,


ROW_NUMBER() 
over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id
FROM sale
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
LEFT OUTER JOIN
sales_mult_prop_val_vw mp ON sales.chg_of_owner_id = mp.chg_of_owner_id 
LEFT OUTER JOIN
sale_conf ON sales.chg_of_owner_id = sale_conf.chg_of_owner_id
LEFT JOIN 
web_internet_benton.dbo._clientdb_deed_history_detail as deed_history 
ON sales.chg_of_owner_id = deed_history.chg_of_owner_id 
LEFT JOIN property 
ON 
land.prop_id = property.prop_id
LEFT JOIN 
( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
FROM imprv 
WHERE imprv.prop_val_yr = (select appr_yr from pacs_system) ) 
as imprv_fix ON land.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from pacs_system)
LEFT JOIN property_profile pp ON land.prop_id = pp.prop_id AND pp.prop_val_yr = (select appr_yr from pacs_system) LEFT JOIN 
property_profile pp2 ON land.prop_id = pp2.prop_id AND pp2.prop_val_yr = (select appr_yr-1 from pacs_system) 
LEFT JOIN property_val pv ON land.prop_id = pv.prop_id AND pv.prop_val_yr = (select appr_yr from pacs_system)left join 
appraiser ap on  pv.last_appraiser_id = ap.appraiser_id  left join appraiser ap1 on  pv.last_appraiser_id = ap1.appraiser_id LEFT JOIN 
property_val pv2 ON land.prop_id = pv2.prop_id AND pv2.prop_val_yr = (select appr_yr -1 from pacs_system)LEFT JOIN 
(SELECT [prop_id] ,[prop_val_yr],[imprv_id],sum([unit_price]) as unit_price, sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,
sum(net_rentable_area) as net_rentable_area,sum(new_value) as new_value FROM [pacs_oltp].[dbo].[imprv_detail] GROUP BY prop_id, imprv_id,[prop_val_yr] ) as imprv_details 
ON imprv_fix.prop_id = imprv_details.prop_id and imprv_fix.prop_val_yr = imprv_details.prop_val_yr and imprv_fix.imprv_id = imprv_details.imprv_id
LEFT JOIN (SELECT prop_id, imprv_id,
CAST(SUM(finished_basement) AS INT)																	as finished_basement, 
CAST(SUM(unfinished_basement) AS INT)																as unfinished_basement,
CAST(SUM(attached_garage) AS INT)																	as attached_garage, 
CAST(count(attached_garage) AS INT)																	as attached_garage_Count, 
CAST(SUM(detached_garage) AS INT)																	as detached_garage,
CAST(Count(detached_garage) AS INT)																	as detached_garage_Count,
CAST(SUM(carport) AS INT)																			as carport,
CAST(Count(carport) AS INT)																			as carport_Count,
CAST(SUM(Pole_building) AS INT)																		as Pole_building,
CAST(count(Pole_building) AS INT)																	as Pole_building_Count															

FROM (SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
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
[prop_val_yr] = (select appr_yr from pacs_system)
AND rtrim(imprv_det_type_cd) 
IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg' ) 
OR rtrim(imprv_det_desc) = 'Main Area' ) as imprv_areas
GROUP BY prop_id, imprv_id )  as sum_imprv_areas 
ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id
left join
--(SELECT imprv_id, prop_id, prop_val_yr, SUM(CASE WHEN i_attr_val_id = 15 THEN CAST(i_attr_val_cd AS INT) END) as Bedrooms,Sum(CASE WHEN i_attr_val_id = 45 THEN CAST(i_attr_unit AS INT) END) as Bathrooms,Sum(CASE WHEN i_attr_val_id = 46 THEN CAST(i_attr_unit AS INT) END) as HalfBaths,
--SUM(CASE WHEN i_attr_val_id = 47 THEN CAST(i_attr_unit AS INT) END) as Fixture_Count,MIN(CASE WHEN i_attr_val_id = 2 THEN i_attr_val_cd END) as Foundation,MIN(CASE WHEN i_attr_val_id = 3 THEN i_attr_val_cd END) as ExtWall,
--MIN(CASE WHEN i_attr_val_id = 6 THEN i_attr_val_cd END) as RoofCovering,MIN(CASE WHEN i_attr_val_id = 9 THEN i_attr_val_cd END) as HVAC,MIN(CASE WHEN i_attr_val_id = 10 THEN i_attr_unit END) as Fireplace,
--SUM(CASE WHEN i_attr_val_id = 10 THEN imprv_attr_val END) as Fireplace_Cost,SUM(CASE WHEN i_attr_val_id = 10 THEN imprv_attr_val END) as FixtureCount_Cost
(SELECT imprv_id, prop_id, prop_val_yr, 
SUM(CASE WHEN i_attr_val_id = 15		THEN CAST(i_attr_val_cd AS INT) END)								as Bedrooms,
Sum(CASE WHEN i_attr_val_id = 45		THEN CAST(i_attr_unit AS INT) END)									as Bathrooms,
Sum(CASE WHEN i_attr_val_id = 46		THEN CAST(i_attr_unit AS INT) END)									as HalfBaths,
SUM(CASE WHEN i_attr_val_id = 47		THEN CAST(i_attr_unit AS INT) END)									as Fixture_Count,
MIN(CASE WHEN i_attr_val_id = 67		THEN i_attr_val_cd END)												as SolarPanels,
MIN(CASE WHEN i_attr_val_id = 10		THEN i_attr_unit END)												as Fireplace,
MIN(CASE WHEN i_attr_val_id = 2			THEN i_attr_val_cd END)												as Foundation,
MIN(CASE WHEN i_attr_val_id = 3			THEN i_attr_val_cd END)												as ExtWall,
MIN(CASE WHEN i_attr_val_id = 6			THEN i_attr_val_cd END)												as RoofCovering,
MIN(CASE WHEN i_attr_val_id = 9			THEN i_attr_val_cd END)												as HVAC,
MIN(CASE WHEN i_attr_val_id = 39		THEN i_attr_val_cd END)												as Comm_frame,
MIN(CASE WHEN i_attr_val_id = 51		THEN i_attr_val_cd END)												as Comm_Shape,							
MIN(CASE WHEN i_attr_val_id = 61		THEN i_attr_val_cd END)												as COMM_Tank_Type,							
MIN(CASE WHEN i_attr_val_id = 63		THEN i_attr_val_cd END)												as COMM_Service_Pit,							
MIN(CASE WHEN i_attr_val_id = 62		THEN i_attr_val_cd END)												as COMM_Tank_Capacity,							
MIN(CASE WHEN i_attr_val_id = 58		THEN i_attr_val_cd END)												as COMM_Units,							
MIN(CASE WHEN i_attr_val_id = 12		THEN i_attr_val_cd END)												as Comm__Sprinkler,							
MIN(CASE WHEN i_attr_val_id = 31		THEN i_attr_val_cd END)												as COMM_HVAC,							
MIN(CASE WHEN i_attr_val_id = 56		THEN i_attr_val_cd END)												as COMM_Elevators,							
SUM(CASE WHEN i_attr_val_id = 10		THEN imprv_attr_val END)											as Fireplace_Cost,
SUM(CASE WHEN i_attr_val_id = 47		THEN imprv_attr_val END)											as FixtureCount_Cost


FROM imprv_attr

GROUP BY 
prop_id, imprv_id, prop_val_yr ) as imprv_items ON imprv_fix.prop_id = imprv_items.prop_id AND imprv_fix.imprv_id = imprv_items.imprv_id AND imprv_items.prop_val_yr = (select appr_yr from pacs_system) LEFT JOIN 
land_detail ON property.prop_id = land_detail.prop_id AND land_detail.prop_val_yr = (select appr_yr from pacs_system)
LEFT JOIN abs_subdv ON pv.abs_subdv_cd = abs_subdv.abs_subdv_cd LEFT Join situs 
on pv.prop_id=situs.prop_id left join owner o on pv.prop_id = o.prop_id  and pv.prop_val_yr = o.owner_tax_yr and pv.sup_num = o.sup_num
inner  join account a on o.owner_id=a.acct_id LEFT JOIN (SELECT vw.prop_id, ROW_NUMBER() over (partition by vw.prop_id ORDER BY vw.bldg_permit_id DESC) 
AS order_id,vw.bldg_permit_status, vw.bldg_permit_issue_dt, vw.bldg_permit_active, building_permit.bldg_permit_cmnt,building_permit.bldg_permit_desc, 
vw.bldg_permit_num, building_permit.bldg_permit_dt_complete FROM BUILDING_PERMIT_VW as vw LEFT JOIN building_permit ON vw.bldg_permit_id = building_permit.bldg_permit_id
WHERE prop_id IS NOT NULL ) as permits ON land.prop_id = permits.prop_id AND permits.order_id = 1 LEFT JOIN wash_prop_owner_tax_area_assoc AS wta WITH (nolock) ON wta.year = pv.prop_val_yr AND wta.prop_id = pv.prop_id AND wta.sup_num = pv.sup_num 
left join tax_area AS ta WITH (nolock) ON ta.tax_area_id = wta.tax_area_id left join (SELECT  row_number() over(partition by prop_id order by id desc) as order_id, 
prop_id, REPLACE( REPLACE( image_path, '\\CHPACS\OLTP\pacs_oltp\Images\',''), '\\CHPACS\OLTP\pacs_oltp\\','') AS img_path FROM [web_internet_benton].[dbo].[_clientdb_property_image]
WHERE image_type = 'PIC' ) as images ON land.prop_id = images.prop_id AND images.order_id = 1 LEFT JOIN (SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,
[Prop_ID],--Geometry,
[Geometry].STCentroid().STX as XCoord,[Geometry].STCentroid().STY as YCoord ,[CENTROID_X] as x ,[CENTROID_Y] as y
FROM 
--[Benton_spatial_data].[dbo].[spatial_coords]
[Benton_spatial_data].[dbo].[parcel]) as coords ON land.prop_id = coords.Prop_ID AND coords.order_id = 1
WHERE land.prop_val_yr = (select appr_yr  from pacs_system)  
and pv.prop_inactive_dt is null
--and imprv_fix.sale_id=0

GO

