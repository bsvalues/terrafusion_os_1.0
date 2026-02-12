create view __MH_in_Parks as
SELECT distinct
  pv.prop_val_yr as 'Year',
pv.prop_id as 'ParcelID', 

p.geo_id as 'Geo ID', 
pv.hood_cd as 'NBHD',
pv.mbl_hm_park as 'MH_Park_Code',
mh.abs_subdv_desc as 'MH_Park_Desc',
pv.mbl_hm_space 'MH -_Park_Space',
pv.cycle as 'reval',
pv.property_use_cd as 'Primary_Use',
pv.legal_acreage as 'Legal_Acres',
convert(varchar (20), Deed_Dt, 111) as 'Deed_Date', 
convert(varchar (20), Sale_Dt, 111) as 'SaleDate',
Sale_Price as 'Sale_Price',
Adjusted_Sale as 'Adj_Sale_Price',
idt.imprv_det_type_cd as 'Imprv_Det_Type',

--idt.condition_cd as 'Condition',
ac.file_as_name as 'Owner',
s.situs_num 'Situs_Num', 
s.situs_street_prefx 'Situs_Prefix', 
s.situs_street 'Situs_Street', 
s.situs_street_sufix 'Situs_Suffix', 
s.situs_city 'Situs_City',
idt.imprv_det_adj_val 'Imprv_Det_Adj_Value', 
rtrim(idt.dep_pct) as dep_pct,
rtrim(idt.add_factor) as add_factor,
rtrim(idt.depreciation_yr) as depreciation_yr,
rtrim(idt.use_up_for_pct_base) as se_up_for_pct_base,
rtrim(idt.depreciated_replacement_cost_new) as RCN,
idt.economic_pct,
idt.functional_pct,
idt.imprv_det_adj_amt,
idt.imprv_det_adj_factor,
idt.imprv_det_adj_val,
pv.market as 'Total_Market',
pv.legal_desc as 'Legal_Desc',
pa.link_type_cd,

i.imprv_desc,
i.num_imprv,

case when idt.override_area = 'T' then 'Checked' 
	else 'Unchecked' end as 'Override', 


--idt.imprv_det_class_cd as 'Class',
idt.sketch_area																													as 'SketchArea',
idt.calc_area																													as calc_area,
	pp.living_area																												as TotalArea, 
	sum_imprv_areas.finished_basement																							as finished_basement,
	sum_imprv_areas.unfinished_basement																							as unfinished_basement,
	CAST(ISNULL(sum_imprv_areas.finished_basement, 0) 
	+ ISNULL(sum_imprv_areas.unfinished_basement, 0) AS numeric(18, 0))															as Total_Basement,
	rtrim(imprv_fix.actual_year_built)																	as YearBuilt, 
	pp.actual_age																						as Age,
	rtrim(pp.class_cd)																					as class_cd,
	rtrim(pp.class_cd) + ' ' + rtrim(pp.imprv_det_sub_class_cd)											as class_subclass_cd,
	rtrim(pp.condition_cd)																				as Condition,
	idt.imprv_det_desc																					as imprv_det_desc,
	--[imprv_det_desc]																					as imprv_det_desc,
	rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), ''))							as Style, 
	rtrim(imprv_items.RoofCovering)																		as Roofing, 
	rtrim(imprv_items.HVAC)																				as Heating, 
	rtrim(imprv_items.ExtWall)																			as ExtWall,
	imprv_items.Bathrooms																				as Bathrooms, 
	imprv_items.HalfBaths																				as HalfBaths, 
	imprv_items.Fireplace																				as fireplace, 
	imprv_items.Foundation																				as foundation, 
	rtrim(imprv_items.Fixture_Count)																	as fixture_count,
	rtrim(imprv_items.FixtureCount)                                                                     as fixture_Cost,
	imprv_items.Fireplace_Cost																			as fireplace_cost, 
	imprv_items.Solar_Panels																			as Solar_Panels,
	sum_imprv_areas.attached_garage																		as attached_garage, 
	sum_imprv_areas.detached_garage																		as detached_garage,
	sum_imprv_areas.carport																				as Carport,
	sum_imprv_areas.Pole_building																		as Pole_building,


XCoord,
ycoord

FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
     pv.prop_id = psa.prop_id
     AND pv.prop_val_yr = psa.owner_tax_yr
     AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
	--AND p.geo_id like '4%'---you can change as needed
INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN account ac WITH (nolock) ON 
	o.owner_id = ac.acct_id
INNER JOIN imprv_detail idt WITH (nolock) ON
	pv.prop_id = idt.prop_id
	AND pv.prop_val_yr = idt.prop_val_yr 
	AND pv.sup_num = idt.sup_num
	AND idt.sale_id = 0
	AND idt.imprv_det_type_cd = 'MHOME'---you can change as needed
inner join imprv i
on pv.prop_id=i.prop_id
and pv.prop_val_yr=i.prop_val_yr
and pv.sup_num=i.sup_num
and i.sale_id=0
and i.imprv_type_cd like '%MH%'

LEFT OUTER JOIN abs_subdv mh WITH (nolock) ON	
	pv.mbl_hm_park = mh.abs_subdv_cd
	AND pv.prop_val_yr = mh.abs_subdv_yr

LEFT OUTER JOIN
    (select copa.prop_id, coo.deed_dt as Deed_Dt, 
    sl.sl_dt as Sale_Dt, sl.sl_price as Sale_Price,
	sl.adjusted_sl_price as Adjusted_Sale
    from chg_of_owner_prop_assoc copa with (nolock)
    inner join chg_of_owner coo with (nolock) on
        copa.chg_of_owner_id = coo.chg_of_owner_id
	inner join sale sl with (nolock) on
		copa.chg_of_owner_id = sl.chg_of_owner_id
		and sl.sl_price > 0
    and copa.seq_num = 0) as sb
    on pv.prop_id = sb.prop_id
LEFT OUTER JOIN situs s WITH (nolock) ON
	pv.prop_id = s.prop_id
	AND isnull(s.primary_situs, 'N') = 'Y'

	left join 
	(SELECT  child_prop_id,pv.prop_id,
		parent_prop_id
      ,appraised_val,market,pv.business_close_dt,pv.business_start_dt
     
      ,pa.sup_num

	  ,pa.prop_val_yr
      ,lOrder
      ,link_type_cd
      ,link_sub_type_cd


	
  FROM [pacs_oltp].[dbo].[property_val] pv
  inner join 
  [pacs_oltp].[dbo].property_assoc pa
  on 
  pv.prop_id=pa.parent_prop_id and pv.prop_val_yr=pa.prop_val_yr
 
   
  where  pv.prop_val_yr=(select appr_yr 
from pacs_system)) as pa
on pa.prop_id=pv.prop_id
LEFT JOIN 
	( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv 
			WHERE [pacs_oltp].[dbo].imprv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) and sale_id=0 ) as imprv_fix 
				ON pv.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)

LEFT JOIN 
	(SELECT [prop_id] ,[prop_val_yr],[imprv_id], sum([unit_price]) as unit_price, sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,sum(net_rentable_area) as net_rentable_area,
		sum(new_value) as new_value
			FROM [pacs_oltp].[dbo].[imprv_detail]
				GROUP BY prop_id, imprv_id,[prop_val_yr]) as imprv_details 
					ON imprv_fix.prop_id = imprv_details.prop_id and imprv_fix.prop_val_yr = imprv_details.prop_val_yr and imprv_fix.imprv_id = imprv_details.imprv_id
LEFT JOIN
	(SELECT prop_id, imprv_id,
		CAST(SUM(finished_basement) AS INT) 	as finished_basement, 
		CAST(SUM(unfinished_basement) AS INT)	as unfinished_basement,
		CAST(SUM(attached_garage) AS INT) 		as attached_garage, 
		CAST(SUM(detached_garage) AS INT) 		as detached_garage,
		CAST(SUM(carport) AS INT) 				as carport,
		CAST(SUM(Pole_building) AS INT) 		as Pole_building
		
		FROM 
			(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
				CASE WHEN rtrim(imprv_det_desc) = 'Main Area' THEN imprv_det_area ELSE 0 END AS living_area, 
				--imprv_detail.imprv_det_type_cd,
				CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT' THEN imprv_det_area ELSE 0 END AS finished_basement, 
				CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT' THEN imprv_det_area ELSE 0 END AS unfinished_basement,
				CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR' THEN imprv_det_area ELSE 0 END AS attached_garage, 
				CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR' THEN imprv_det_area ELSE 0 END AS detached_garage,
				CASE WHEN rtrim(imprv_det_type_cd) = 'carport' THEN imprv_det_area ELSE 0 END AS Carport,
				CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg' THEN imprv_det_area ELSE 0 END AS Pole_building
					FROM [pacs_oltp].[dbo].imprv_detail 
						WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
						IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg' ) OR rtrim(imprv_det_desc) = 'Main Area' ) as imprv_areas 
							GROUP BY prop_id, imprv_id)  as sum_imprv_areas ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id
left join 
		(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
		CASE WHEN rtrim(imprv_det_desc) = 'Main Area' THEN imprv_det_area ELSE 0 END AS living_area, 
		--imprv_detail.imprv_det_type_cd,
		CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT' THEN 'BSMT' ELSE 0 END AS finished_basement, 
		CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT' THEN 'U-BSMT' ELSE 0 END AS unfinished_basement,
		CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR' THEN 'ATTGAR'ELSE 0 END AS attached_garage, 
		CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR' THEN 'DETGAR' ELSE 0 END AS detached_garage,
		CASE WHEN rtrim(imprv_det_type_cd) = 'carport' THEN 'carport' ELSE 0 END AS Carport,
		CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg' THEN 'polebldg' ELSE 0 END AS Pole_building
			FROM [pacs_oltp].[dbo].imprv_detail 
				WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
					IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg' ) OR rtrim(imprv_det_desc) = 'Main Area'  
						GROUP BY prop_id, imprv_id  ,imprv_det_id,imprv_det_desc,imprv_det_area,imprv_detail.imprv_det_type_cd) as ia
						ON imprv_fix.prop_id = ia.prop_id AND imprv_fix.imprv_id = ia.imprv_id
LEFT JOIN 
	(SELECT imprv_id, prop_id, prop_val_yr, 
		SUM(CASE WHEN i_attr_val_id = 15 THEN CAST(i_attr_val_cd  AS INT ) else 0 END)	as Bedrooms,
		Sum(CASE WHEN i_attr_val_id = 45 THEN CAST(i_attr_unit AS INT)else 0 END)		as Bathrooms,
		Sum(CASE WHEN i_attr_val_id = 46 THEN CAST(i_attr_unit AS INT)else 0 END)		as HalfBaths,
		SUM(CASE WHEN i_attr_val_id = 47 THEN CAST(i_attr_unit AS INT)else 0 END)		as Fixture_Count,
		MIN(CASE WHEN i_attr_val_id = 2 THEN i_attr_val_cd  END)						as Foundation,
		MIN(CASE WHEN i_attr_val_id = 3 THEN i_attr_val_cd  END)						as ExtWall,
		MIN(CASE WHEN i_attr_val_id = 6 THEN i_attr_val_cd  END)						as RoofCovering,
		MIN(CASE WHEN i_attr_val_id = 9 THEN i_attr_val_cd  END)						as HVAC,
		MIN(CASE WHEN i_attr_val_id = 10 THEN i_attr_unit  END)							as Fireplace,
		SUM(CASE WHEN i_attr_val_id = 10 THEN imprv_attr_val else 0 END)				as Fireplace_Cost,
		SUM(CASE WHEN i_attr_val_id = 47 THEN imprv_attr_val else 0 END)				as FixtureCount,
		SUM(CASE WHEN i_attr_val_id = 67 THEN imprv_attr_val else 0 END)				as Solar_Panels,

		MIN(CASE WHEN i_attr_val_id = 39 THEN i_attr_val_cd END)						as Comm_frame,
		MIN(CASE WHEN i_attr_val_id = 51 THEN i_attr_val_cd END)						as Comm_Shape,	
		max(CASE WHEN i_attr_val_id = 51 THEN i_attr_unit END)							as Comm_Shape_units,						
		MIN(CASE WHEN i_attr_val_id = 61 THEN i_attr_val_cd END)						as COMM_Tank_Type,	
		max(CASE WHEN i_attr_val_id = 61 THEN i_attr_unit END)							as COMM_Tank_Type_units,					
		MIN(CASE WHEN i_attr_val_id = 63 THEN i_attr_val_cd END)						as COMM_Service_Pit,	
		max(CASE WHEN i_attr_val_id = 63 THEN i_attr_unit END)							as COMM_Service_Pit_units,						
		max(CASE WHEN i_attr_val_id = 62 THEN i_attr_val_cd END)						as COMM_Tank_Capacity,	
		max(CASE WHEN i_attr_val_id = 62 THEN i_attr_unit END)							as COMM_Tank_Capacity_units,						
		max(CASE WHEN i_attr_val_id = 58 THEN i_attr_val_cd END)						as COMM_Units,							
		MIN(CASE WHEN i_attr_val_id =12 THEN i_attr_val_cd END)							as Comm__Sprinkler,
		max(CASE WHEN i_attr_val_id = 12 THEN i_attr_unit END )							as Comm_Spinkler_units,					
		MIN(CASE WHEN i_attr_val_id = 31 THEN i_attr_val_cd END)						as COMM_HVAC,	
		max(CASE WHEN i_attr_val_id = 31 THEN i_attr_unit END )							as COMM_HVAC_units,								
		MIN(CASE WHEN i_attr_val_id = 56 THEN i_attr_val_cd END)						as COMM_Elevators,
		max(CASE WHEN i_attr_val_id = 56 THEN i_attr_unit END)							as COMM_Elevator_unit	
			FROM [pacs_oltp].[dbo].imprv_attr
				GROUP BY prop_id, imprv_id, prop_val_yr ) as imprv_items 
					ON imprv_fix.prop_id = imprv_items.prop_id AND imprv_fix.imprv_id = imprv_items.imprv_id AND imprv_items.prop_val_yr = (select appr_yr from[pacs_oltp].[dbo]. pacs_system) 
left join
	(SELECT distinct [prop_id]
      ,[prop_val_yr],[imprv_id],[imprv_det_id] ,[sup_num]  ,[sale_id] ,[imprv_det_class_cd],[imprv_det_meth_cd]  ,[imprv_det_type_cd] ,[seq_num] ,[imprv_det_val] ,[imprv_det_val_source]
      ,[imprv_det_desc] ,[imprv_det_area] ,[imprv_det_area_type] ,[calc_area] ,[sketch_area] ,  imprv_det_calc_val, depreciated_replacement_cost_new  ,physical_pct, economic_pct,functional_pct,new_value,new_value_flag
  ,add_factor,depreciation_yr, yr_new,use_up_for_pct_base,stories_multiplier
  FROM [pacs_oltp].[dbo].[imprv_detail]
	 where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
			and sale_id=0
			and imprv_det_desc='Main Area') as id on imprv_fix.prop_id = id.prop_id AND imprv_fix.imprv_id = id.imprv_id AND 
			imprv_items.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)

LEFT JOIN 
	[pacs_oltp].[dbo].property_profile pp
		ON pv.prop_id = pp.prop_id AND pp.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
LEFT JOIN
	[pacs_oltp].[dbo].property_profile pp2
		ON pv.prop_id= pp2.prop_id AND pp2.prop_val_yr = (select tax_yr from [pacs_oltp].[dbo].pacs_system) 
--LEFT JOIN 
	--[pacs_oltp].[dbo].property_val pv
	--	ON pv.prop_id = pv.prop_id AND pv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
left join 
	[pacs_oltp].[dbo].appraiser ap 
		on pv.last_appraiser_id = ap.appraiser_id
left  join 
	[pacs_oltp].[dbo].appraiser ap1
		on pv.next_appraiser_id = ap1.appraiser_id
LEFT JOIN 
	property_val pv2
		ON pv.prop_id = pv2.prop_id AND pv2.prop_val_yr = (select tax_yr from [pacs_oltp].[dbo].pacs_system)			
			 
  LEFT JOIN 

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
--Geometry,
[shape].STCentroid().STX as XCoord,
[shape].STCentroid().STY as YCoord ,

      [CENTROID_X] as x
      ,[CENTROID_Y] as y

FROM 
--[Benton_spatial_data].[dbo].[spatial_coords]
[Benton_spatial_data].[dbo].[parcel]
) as coords
 
ON 

pv.prop_id = coords.Prop_ID AND coords.order_id = 1


WHERE pv.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)---you can change as needed
AND pv.cycle = 5---you can change as needed
AND pv.prop_inactive_dt is null
--and XCoord is not null
and pv.hood_cd like '4%'

GO

