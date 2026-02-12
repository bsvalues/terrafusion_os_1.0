create view __aImprv as 
SELECT DISTINCT 
--Parcel identification 
	
	pv.prop_id																							as ParcelID,  
	rtrim(property.geo_id)																				as 'geo_id', 
	pv.prop_id																							as prop_id, 
--Property codes	
	--rtrim(pp.property_use_cd)																			as property_use_cd,
	--rtrim(property.prop_type_cd)																		as prop_type_cd, 
	--RTRIM(property_use_desc)																			as property_use_desc,
--Improvements
	rtrim(imprv_fix.imprv_type_cd)																		as PrimaryImprovement,
	pp.living_area																						as TotalArea, 
	sum_imprv_areas.finished_basement																	as finished_basement,
	sum_imprv_areas.unfinished_basement																	as unfinished_basement,
	CAST(ISNULL(sum_imprv_areas.finished_basement, 0) 
	+ ISNULL(sum_imprv_areas.unfinished_basement, 0) AS numeric(18, 0))									as Total_Basement,

	rtrim(imprv_fix.actual_year_built)																	as YearBuilt, 
	pp.actual_age																						as Age,
	rtrim(pp.class_cd)																					as class_cd,
	rtrim(pp.class_cd) + ' ' + rtrim(pp.imprv_det_sub_class_cd)											as class_subclass_cd,
	rtrim(pp.condition_cd)																				as Condition,
	[imprv_det_desc]																					as imprv_det_desc,
	rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), ''))							as Style, 
	rtrim(imprv_items.RoofCovering)																		as Roofing, 
	rtrim(imprv_items.HVAC)																				as Heating, 
	rtrim(imprv_items.ExtWall)																			as ExtWall,
	imprv_items.Bathrooms																				as Bathrooms, 
	imprv_items.HalfBaths																				as HalfBaths, 
	imprv_items.Fireplace																				as fireplace, 
	imprv_items.Foundation																				as foundation, 
	rtrim(imprv_items.Fixture_Count)																	as fixture_count,
	sum_imprv_areas.attached_garage																		as attached_garage, 
	sum_imprv_areas.detached_garage																		as detached_garage,
	sum_imprv_areas.carport																				as Carport,
	sum_imprv_areas.Pole_building																		as Pole_building



	



FROM 
	(SELECT prop_id, SUM(size_acres) as size_acres, prop_val_yr, state_cd
				FROM pacs_oltp.dbo.land_detail 
					GROUP BY prop_id,  prop_val_yr,state_cd) as land
LEFT JOIN 
	(SELECT chg_of_owner_prop_assoc.prop_id, sale.sl_price,  sale.sl_ratio_type_cd, sale.sl_county_ratio_cd, sale.sl_dt, sale.adjusted_sl_price,sale.chg_of_owner_id,
	sale.land_only_sale,sale.sl_qualifier,sale.sl_land_unit_price,sale.sl_class_cd,sale.sl_imprv_unit_price,sale.sl_type_cd,sale.pers_prop_val,sale.sl_adj_rsn,
	sale.sl_land_type_cd,sale.continue_current_use,chg_of_owner.excise_number,chg_of_owner.recorded_dt,chg_of_owner.comment,chg_of_owner.deed_type_cd,
	ROW_NUMBER()over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id
				FROM pacs_oltp.dbo.sale
left JOIN 
	pacs_oltp.dbo.chg_of_owner_prop_assoc 
		on sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
left join 
	pacs_oltp.dbo.chg_of_owner
		on chg_of_owner.chg_of_owner_id=chg_of_owner_prop_assoc.chg_of_owner_id
left join 
	pacs_oltp.dbo.sales_mult_prop_val_vw 		
		on chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id where chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL AND sl_price > 0 			
			) as sales 
				on land.prop_id = sales.prop_id AND sales.order_id = 1 
LEFT JOIN 
	property 
		on land.prop_id = property.prop_id			
left join
	( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv 
			WHERE [pacs_oltp].[dbo].imprv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) and sale_id=0 ) 
			as imprv_fix 
				ON land.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
left join
	pacs_oltp.dbo.property_profile pp
		on land.prop_id = pp.prop_id AND pp.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
left join
	pacs_oltp.dbo.property_val pv
		on land.prop_id = pv.prop_id AND pv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
left join 
	pacs_oltp.dbo.appraiser ap 
		on pv.last_appraiser_id = ap.appraiser_id
left  join 
	pacs_oltp.dbo.appraiser ap1
		on pv.next_appraiser_id = ap1.appraiser_id
left join  
	(SELECT [prop_id] ,[prop_val_yr],[imprv_id], sum([unit_price]) as unit_price, sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,sum(net_rentable_area) 
	as net_rentable_area,
		sum(new_value) as new_value
			FROM [pacs_oltp].[dbo].[imprv_detail]
				GROUP BY prop_id, imprv_id,[prop_val_yr]) as 
				imprv_details 
					ON imprv_fix.prop_id = imprv_details.prop_id and imprv_fix.prop_val_yr = imprv_details.prop_val_yr and imprv_fix.imprv_id = imprv_details.imprv_id
left join	
(SELECT prop_id, imprv_id,
		CAST(SUM(finished_basement) 	AS INT) 	as finished_basement, 
		CAST(SUM(unfinished_basement) 	AS INT)		as unfinished_basement,
		CAST(SUM(attached_garage) 		AS INT) 	as attached_garage, 
		CAST(SUM(detached_garage) 		AS INT) 	as detached_garage,
		CAST(SUM(carport) 				AS INT) 	as carport,
		CAST(SUM(Pole_building) 		AS INT) 	as Pole_building

		
			FROM 
				(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
					CASE WHEN rtrim(imprv_det_desc)    = 'Main Area'	THEN imprv_det_area ELSE 0 END AS living_area, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT'			THEN imprv_det_area ELSE 0 END AS finished_basement, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT'		THEN imprv_det_area ELSE 0 END AS unfinished_basement,					
					CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR'		THEN imprv_det_area ELSE 0 END AS attached_garage, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR'		THEN imprv_det_area ELSE 0 END AS detached_garage,
					CASE WHEN rtrim(imprv_det_type_cd) = 'carport'		THEN imprv_det_area ELSE 0 END AS Carport,
					CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg'		THEN imprv_det_area ELSE 0 END AS Pole_building
				

						FROM pacs_oltp.dbo.imprv_detail 
							WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
							IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg') 
								OR rtrim(imprv_det_desc) = 'Main Area' ) 
					as imprv_areas 
								GROUP BY prop_id, imprv_id)  
								as sum_imprv_areas 
								ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id
left join 
		(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
		prop_id, imprv_id, imprv_det_id, 
		CASE WHEN rtrim(imprv_det_desc)		= 'Main Area'	THEN 'main area'	ELSE 0 END			AS living_area, 		
		CASE WHEN rtrim(imprv_det_type_cd)	= 'BSMT'		THEN 'BSMT'			ELSE 0 END			AS finished_basement, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'U-BSMT'		THEN 'U-BSMT'		ELSE 0 END			AS unfinished_basement,		
		CASE WHEN rtrim(imprv_det_type_cd)	= 'ATTGAR'		THEN 'ATTGAR'		ELSE 0 END			AS attached_garage, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'DETGAR'		THEN 'DETGAR'		ELSE 0 END			AS detached_garage,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'carport'		THEN 'carport'		ELSE 0 END			AS Carport,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'polebldg'	THEN 'polebldg'		ELSE 0 END			AS Pole_building
	

			FROM [pacs_oltp].[dbo].imprv_detail 
				WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
					IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg') OR rtrim(imprv_det_desc) = 'Main Area'  
						GROUP BY prop_id, imprv_id  ,imprv_det_id,imprv_det_desc,imprv_det_area,imprv_detail.imprv_det_type_cd)
						 as ia
							ON imprv_fix.prop_id = ia.prop_id AND imprv_fix.imprv_id = ia.imprv_id					
LEFT JOIN 
		(SELECT imprv_id, prop_id, prop_val_yr, 
		SUM(CASE WHEN i_attr_val_id = 15	THEN CAST(i_attr_val_cd  AS INT ) else 0 END)	as Bedrooms,
		Sum(CASE WHEN i_attr_val_id = 45	THEN CAST(i_attr_unit AS INT)else 0 END)		as Bathrooms,
		Sum(CASE WHEN i_attr_val_id = 46	THEN CAST(i_attr_unit AS INT)else 0 END)		as HalfBaths,
		SUM(CASE WHEN i_attr_val_id = 47	THEN CAST(i_attr_unit AS INT)else 0 END)		as Fixture_Count,
		MIN(CASE WHEN i_attr_val_id = 2		THEN i_attr_val_cd  END)						as Foundation,
		MIN(CASE WHEN i_attr_val_id = 3		THEN i_attr_val_cd  END)						as ExtWall,
		MIN(CASE WHEN i_attr_val_id = 6		THEN i_attr_val_cd  END)						as RoofCovering,
		MIN(CASE WHEN i_attr_val_id = 9		THEN i_attr_val_cd  END)						as HVAC,
		MIN(CASE WHEN i_attr_val_id = 10	THEN i_attr_unit  END)							as Fireplace,
		SUM(CASE WHEN i_attr_val_id = 10	THEN imprv_attr_val else 0 END)					as Fireplace_Cost,
		SUM(CASE WHEN i_attr_val_id = 47	THEN imprv_attr_val else 0 END)					as FixtureCount,
		SUM(CASE WHEN i_attr_val_id = 67	THEN imprv_attr_val else 0 END)					as Solar_Panels

	
			FROM [pacs_oltp].[dbo].Imprv_attr
				GROUP BY prop_id, imprv_id, prop_val_yr ) as imprv_items 
					ON imprv_fix.prop_id = imprv_items.prop_id AND imprv_fix.imprv_id = imprv_items.imprv_id AND imprv_items.prop_val_yr = (select appr_yr from[pacs_oltp].[dbo]. pacs_system) 
left join
	(SELECT distinct [prop_id]  ,[prop_val_yr],[imprv_id], [imprv_det_id]  ,[sup_num] ,[sale_id]  ,[imprv_det_class_cd],[imprv_det_meth_cd]  ,[imprv_det_type_cd] ,[seq_num] ,[imprv_det_val]
	,[imprv_det_val_source],[imprv_det_desc] ,[imprv_det_area]  ,[imprv_det_area_type] ,[calc_area] ,[sketch_area] ,  imprv_det_calc_val, depreciated_replacement_cost_new ,physical_pct, economic_pct,functional_pct,new_value,
	new_value_flag,add_factor,depreciation_yr, yr_new,use_up_for_pct_base,stories_multiplier, imprv_det_adj_factor ,imprv_det_adj_val,dep_pct_override,physical_pct_override,functional_pct_override,economic_pct_override
  ,size_adj_pct,size_adj_pct_override,imprv_det_cost_unit_price, imprv_det_ms_unit_price, imprv_det_orig_up, imprv_det_orig_val, load_factor
    FROM [pacs_oltp].[dbo].[imprv_detail]
	 where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
			and sale_id=0
			and imprv_det_desc='Main Area') 
			as id 
			on imprv_fix.prop_id = id.prop_id AND imprv_fix.imprv_id = id.imprv_id AND 
			imprv_items.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].[pacs_system]) 

LEFT JOIN 
	[pacs_oltp].[dbo].land_detail 
		ON property.prop_id = land_detail.prop_id AND land_detail.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
left join
	[pacs_oltp].[dbo].property_use AS pu	
		ON	pu.property_use_cd= pv.property_use_cd 
LEFT JOIN 
	[pacs_oltp].[dbo].abs_subdv 
		ON pv.abs_subdv_cd = abs_subdv.abs_subdv_cd 
LEFT Join 
	[pacs_oltp].[dbo].situs 
		on pv.prop_id=situs.prop_id

left join
	[pacs_oltp].[dbo].owner o
		on  pv.prop_id = o.prop_id  and pv.prop_val_yr = o.owner_tax_yr and pv.sup_num = o.sup_num
inner  join
	[pacs_oltp].[dbo].account a
		on o.owner_id=a.acct_id

LEFT JOIN 
	[pacs_oltp].[dbo].wash_prop_owner_tax_area_assoc AS wta WITH (nolock) 
		ON wta.year = pv.prop_val_yr AND wta.prop_id = pv.prop_id AND wta.sup_num = pv.sup_num 
left join
	tax_area AS ta WITH (nolock) 
		ON ta.tax_area_id = wta.tax_area_id


				WHERE land.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)  
			and pv.prop_inactive_dt is null	--and situs.primary_situs= 'Y'
			and pv.sup_num=0

GO

