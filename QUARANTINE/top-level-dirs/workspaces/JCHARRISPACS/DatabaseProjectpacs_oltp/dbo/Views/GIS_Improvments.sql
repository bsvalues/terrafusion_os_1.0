
Create view [dbo].[GIS_Improvments] as 
SELECT DISTINCT 
--Parcel identification 
	pv.prop_id																							as ParcelID,  
	rtrim(property.geo_id)																				as MapNumber, 
	pv.prop_id																							as prop_id, 
	situs.situs_display																					as situs_display,
	rtrim(replace(abs_subdv.abs_subdv_desc, char(13) + char(10), ''))									as abs_subdv_desc, 
	pv.hood_cd																							as neighborhood, 
	pv.subset_cd																						as subset,
	rtrim(replace(pv.cycle, char(13) + char(10), ''))													as reval,
	


--Improvements
	rtrim(imprv_fix.imprv_type_cd)																		as PrimaryImprovement,
	imprv_fix.imprv_state_cd																			as imprv_state_cd, 
	imprv_fix.stories																					as stories, 
	imprv_fix.num_imprv																					as num_imprv, 
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
	rtrim(imprv_items.FixtureCount)																		as fixture_Cost,
	imprv_items.Fireplace_Cost																			as fireplace_cost, 
	imprv_items.Solar_Panels																			as Solar_Panels,
	
	sum_imprv_areas.attached_garage																		as attached_garage, 
	sum_imprv_areas.detached_garage																		as detached_garage,
	sum_imprv_areas.carport																				as Carport,
	sum_imprv_areas.Pole_building																		as Pole_building,
	ID.sketch_area																						as sketch_area,
	ID.calc_area																						as calc_area,
	idt.Balcony																							as Balcony ,
    idt.bonus_room																						as bonus_room,
    idt.CovBalc																							as CovBalc  ,
    idt.CovDeck																							as CovDeck ,
    idt.CovPatio																						as CovPatio, 
    idt.Deck																							as Deck,  
    idt.EncPorch																						as EncPorch,
    idt.GAZEBO																							as GAZEBO,
    idt.hobby_barn																						as hobby_barn,
    idt.learn_to																						as learn_to,
    idt.LoafingShd																						as LoafingShd
	
--Commercial Fields
		--imprv_items.COMM_Units																		as Comm_Units,
		--imprv_items.COMM_Tank_Type 																	as Comm_Tank_Type,
		--imprv_items.COMM_Tank_Capacity 																as Comm_Tank_Capacity,
		--imprv_items.COMM_Service_Pit 																	as Comm_Service_Pit,
		--imprv_items.COMM_HVAC 																		as Comm_HVAC, 
		--imprv_items.COMM_Elevators																	As Comm_Elevator,
		--imprv_items.Comm__Sprinkler																	as Comm_Sprinkler,
		--imprv_items.Comm_frame																		as Comm_Class_Description,
		--imprv_items.COMM_Shape 																		as Comm_Shape, 
		--imprv_items.Comm_Shape_units 																	as Comm_Shape_units,
		--imprv_items.COMM_HVAC_units 																	as COMM_HVAC_units,
		--imprv_details.net_rentable_area																as net_rentable_area,
		--sum_imprv_areas.Canopy,
		--sum_imprv_areas.Canopy_industrial,
		--sum_imprv_areas.Canopy_light,
		--sum_imprv_areas.Comm_basement,
		--sum_imprv_areas.Comm_basement_partial_finished,
		--sum_imprv_areas.Comm_basement_semifinished,
		--sum_imprv_areas.Comm_basement_unfinished,
		--sum_imprv_areas.deck,
		--sum_imprv_areas.mezzanine_finished_divided,
		--sum_imprv_areas.mezzanine_finished_open,
		--sum_imprv_areas.mezzanine_low_cost_unfinished,
		--sum_imprv_areas.mezzanine_semifinished,
		--sum_imprv_areas.mezzanine_unfinished,



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
	pacs_oltp.dbo.property 
		on land.prop_id = property.prop_id			
left join
	( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv 
			WHERE [pacs_oltp].[dbo].imprv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) and sale_id=0 ) as imprv_fix 
				ON land.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
left join
	pacs_oltp.dbo.property_profile pp
		on land.prop_id = pp.prop_id AND pp.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
left join
	pacs_oltp.dbo.property_profile pp2
		on land.prop_id = pp2.prop_id AND pp2.prop_val_yr = (select tax_yr from [pacs_oltp].[dbo].pacs_system) 
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
	property_val pv2
		on land.prop_id = pv2.prop_id AND pv2.prop_val_yr = (select tax_yr from [pacs_oltp].[dbo].pacs_system)

left join  
	(SELECT [prop_id] ,[prop_val_yr],[imprv_id], sum([unit_price]) as unit_price, sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,sum(net_rentable_area) as net_rentable_area,
		sum(new_value) as new_value
			FROM [pacs_oltp].[dbo].[imprv_detail]
				GROUP BY prop_id, imprv_id,[prop_val_yr]) as imprv_details 
					ON imprv_fix.prop_id = imprv_details.prop_id and imprv_fix.prop_val_yr = imprv_details.prop_val_yr and imprv_fix.imprv_id = imprv_details.imprv_id
left join	
(SELECT prop_id, imprv_id,
		CAST(SUM(living_area) 			AS INT) 	as living_area, 
		CAST(SUM(finished_basement) 	AS INT) 	as finished_basement, 
		CAST(SUM(unfinished_basement) 	AS INT)		as unfinished_basement,
		CAST(SUM(attached_garage) 		AS INT) 	as attached_garage, 
		CAST(SUM(detached_garage) 		AS INT) 	as detached_garage,
		CAST(SUM(carport) 				AS INT) 	as carport,
		CAST(SUM(Pole_building) 		AS INT) 	as Pole_building,
		CAST(SUM(deck) 					AS INT) 	as deck,
		CAST(SUM(mezzanine_finished_divided) 					AS INT) 	as mezzanine_finished_divided,
		CAST(SUM(mezzanine_finished_open) 						AS INT) 	as mezzanine_finished_open,
		CAST(SUM(mezzanine_low_cost_unfinished) 				AS INT) 	as mezzanine_low_cost_unfinished,
		CAST(SUM(mezzanine_semifinished) 						AS INT) 	as mezzanine_semifinished,
		CAST(SUM(mezzanine_unfinished) 							AS INT) 	as mezzanine_unfinished,
		CAST(SUM(Balcony) 										AS INT) 	as Balcony,
		CAST(SUM(Canopy) 										AS INT) 	as Canopy,
		CAST(SUM(Canopy_light) 									AS INT) 	as Canopy_light,
		CAST(SUM(Canopy_industrial) 							AS INT) 	as Canopy_industrial,
		CAST(SUM(Comm_basement) 								AS INT) 	as Comm_basement,
		CAST(SUM(Comm_basement_unfinished) 						AS INT) 	as Comm_basement_unfinished,
		CAST(SUM(Comm_basement_partial_finished) 				AS INT) 	as Comm_basement_partial_finished,
		CAST(SUM(Comm_basement_semifinished) 					AS INT) 	as Comm_basement_semifinished

		
			FROM 
				(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
			
					CASE WHEN rtrim(imprv_det_desc)    = 'Main Area'	THEN imprv_det_area ELSE 0 END AS living_area, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT'			THEN imprv_det_area ELSE 0 END AS finished_basement, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT'		THEN imprv_det_area ELSE 0 END AS unfinished_basement,
					CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR'		THEN imprv_det_area ELSE 0 END AS attached_garage, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR'		THEN imprv_det_area ELSE 0 END AS detached_garage,
					CASE WHEN rtrim(imprv_det_type_cd) = 'carport'		THEN imprv_det_area ELSE 0 END AS Carport,
					CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg'		THEN imprv_det_area ELSE 0 END AS Pole_building,
					CASE WHEN rtrim(imprv_det_type_cd) = 'SWE'			THEN imprv_det_area ELSE 0 END AS SWE,
					CASE WHEN rtrim(imprv_det_type_cd) like 'deck%'			THEN imprv_det_area ELSE 0 END AS deck, 
					CASE WHEN rtrim(imprv_det_type_cd) like'mezzFD'			THEN imprv_det_area ELSE 0 END AS mezzanine_finished_divided,
					CASE WHEN rtrim(imprv_det_type_cd) like'mezzFO'			THEN imprv_det_area ELSE 0 END AS mezzanine_finished_open,
					CASE WHEN rtrim(imprv_det_type_cd) like'mezzLCU'		THEN imprv_det_area ELSE 0 END AS mezzanine_low_cost_unfinished,
					CASE WHEN rtrim(imprv_det_type_cd) like'mezzSF'			THEN imprv_det_area ELSE 0 END AS mezzanine_semifinished,
					CASE WHEN rtrim(imprv_det_type_cd) like'mezzUF'			THEN imprv_det_area ELSE 0 END AS mezzanine_unfinished,
					CASE WHEN rtrim(imprv_det_type_cd) like'balcony%'		THEN imprv_det_area ELSE 0 END AS Balcony, 
					CASE WHEN rtrim(imprv_det_type_cd) like'Canopy%'		THEN imprv_det_area ELSE 0 END AS Canopy,
					CASE WHEN rtrim(imprv_det_type_cd) like'CanopyL%'		THEN imprv_det_area ELSE 0 END AS Canopy_light,
					CASE WHEN rtrim(imprv_det_type_cd) like'CanopyI%'		THEN imprv_det_area ELSE 0 END AS Canopy_industrial,
					CASE WHEN rtrim(imprv_det_type_cd)like'C-BSmtfin'		THEN imprv_det_area ELSE 0 END AS Comm_basement,
					CASE WHEN rtrim(imprv_det_type_cd)like'C-BSmtufin'		THEN imprv_det_area ELSE 0 END AS Comm_basement_unfinished,
					CASE WHEN rtrim(imprv_det_type_cd)like'C-BSMTFWPF'		THEN imprv_det_area ELSE 0 END AS Comm_basement_partial_finished,
					CASE WHEN rtrim(imprv_det_type_cd)like'C-BSMTSFIN'		THEN imprv_det_area ELSE 0 END AS Comm_basement_semifinished
						
						FROM pacs_oltp.dbo.imprv_detail 

							WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
							IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg','deck'	, 'mezzFD'	, 'mezzFO'	, 'mezzLCU'	, 'mezzSF'	
								, 'mezzUF'	, 'balcony%'	, 'Canopy%'	, 'CanopyL%'	, 'CanopyI%'	, 'C-Bsmtfin'	, 'C-Bsmtufin'	, 'C-BSMTFWPF'	, 'C-BSMTSFIN') 
								OR rtrim(imprv_det_desc) = 'Main Area' ) 
					as imprv_areas 
								GROUP BY prop_id, imprv_id)  as sum_imprv_areas ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id
left join 
		(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
		prop_id, imprv_id, imprv_det_id, 
		CASE WHEN rtrim(imprv_det_desc)		= 'Main Area'	THEN imprv_det_area ELSE 0 END			AS living_area, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'BSMT'		THEN 'BSMT'			ELSE 0 END			AS finished_basement, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'U-BSMT'		THEN 'U-BSMT'		ELSE 0 END			AS unfinished_basement,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'ATTGAR'		THEN 'ATTGAR'		ELSE 0 END			AS attached_garage, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'DETGAR'		THEN 'DETGAR'		ELSE 0 END			AS detached_garage,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'carport'		THEN 'carport'		ELSE 0 END			AS Carport,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'polebldg'	THEN 'polebldg'		ELSE 0 END			AS Pole_building,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'SWE'			THEN 'SWE'			ELSE 0 END			AS SWE,
		CASE WHEN rtrim(imprv_det_type_cd) like 'deck%'		THEN 'deck'			ELSE 0 END			AS deck, 
		CASE WHEN rtrim(imprv_det_type_cd) like'mezzFD'		THEN 'mezzFD'		ELSE 0 END			AS mezzanine_finished_divided,
		CASE WHEN rtrim(imprv_det_type_cd) like'mezzFO'		THEN 'mezzFO'		ELSE 0 END			AS mezzanine_finished_open,
		CASE WHEN rtrim(imprv_det_type_cd) like'mezzLCU'	THEN 'mezzLCU'		ELSE 0 END			AS mezzanine_low_cost_unfinished,
		CASE WHEN rtrim(imprv_det_type_cd) like'mezzSF'		THEN 'mezzSF'		ELSE 0 END			AS mezzanine_semifinished,
		CASE WHEN rtrim(imprv_det_type_cd) like'mezzUF'		THEN 'mezzUF'		ELSE 0 END			AS mezzanine_unfinished,
		CASE WHEN rtrim(imprv_det_type_cd) like'balcony%'	THEN 'balcony'		ELSE 0 END			AS Balcony, 
		CASE WHEN rtrim(imprv_det_type_cd) like'Canopy%'	THEN 'Canopy'		ELSE 0 END			AS Canopy,
		CASE WHEN rtrim(imprv_det_type_cd) like'CanopyL%'	THEN 'CanopyL'		ELSE 0 END			AS Canopy_light,
		CASE WHEN rtrim(imprv_det_type_cd) like'CanopyI%'	THEN 'CanopyI'		ELSE 0 END			AS Canopy_industrial,
		CASE WHEN rtrim(imprv_det_type_cd)like'C-BSmtfin'   THEN 'C-BSmtfin'	ELSE 0 END			AS Comm_basement,
		CASE WHEN rtrim(imprv_det_type_cd)like'C-BSmtufin'	THEN 'C-BSmtufin'	ELSE 0 END			AS Comm_basement_unfinished,
		CASE WHEN rtrim(imprv_det_type_cd)like'C-BSMTFWPF'	THEN 'C-BSMTFWPF'	ELSE 0 END			AS Comm_basement_partial_finished,
		CASE WHEN rtrim(imprv_det_type_cd)like'C-BSMTSFIN'	THEN 'C-BSMTSFIN'	ELSE 0 END			AS Comm_basement_semifinished


			FROM [pacs_oltp].[dbo].imprv_detail 
				WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
					IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg','deck'	, 'mezzFD'	, 'mezzFO'	, 'mezzLCU'	, 'mezzSF'	
					, 'mezzUF'	, 'balcony%'	, 'Canopy%'	, 'CanopyL%'	, 'CanopyI%'	, 'C-Bsmtfin'	, 'C-Bsmtufin'	, 'C-BSMTFWPF'	, 'C-BSMTSFIN'	 ) OR rtrim(imprv_det_desc) = 'Main Area'  
						GROUP BY prop_id, imprv_id  ,imprv_det_id,imprv_det_desc,imprv_det_area,imprv_detail.imprv_det_type_cd) as ia
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
		SUM(CASE WHEN i_attr_val_id = 67	THEN imprv_attr_val else 0 END)					as Solar_Panels,

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
		MIN(CASE WHEN i_attr_val_id = 12 THEN i_attr_val_cd END)						as Comm__Sprinkler,
		max(CASE WHEN i_attr_val_id = 12 THEN i_attr_unit END )							as Comm_Spinkler_units,					
		MIN(CASE WHEN i_attr_val_id = 31 THEN i_attr_val_cd END)						as COMM_HVAC,	
		max(CASE WHEN i_attr_val_id = 31 THEN i_attr_unit END )							as COMM_HVAC_units,								
		MIN(CASE WHEN i_attr_val_id = 56 THEN i_attr_val_cd END)						as COMM_Elevators,
		max(CASE WHEN i_attr_val_id = 56 THEN i_attr_unit END)							as COMM_Elevator_unit	
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
			and imprv_det_desc='Main Area') as id on imprv_fix.prop_id = id.prop_id AND imprv_fix.imprv_id = id.imprv_id AND 
			imprv_items.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].[pacs_system]) 
left join 
  ( SELECT  [prop_id] ,[prop_val_yr] ,[ag_barn] ,[ag_cannabs] ,[ag_dairy],[ag_haystor],[ag_lf_brn] ,[ag_machine],[ag_potato],[ag_quonset],[ag_steelut],[APARTHRS  ],[ATTGAR    ],[Balcony   ],[bonus_room],[BSMT      ]
      ,[Carport   ],[CovBalc   ],[CovDeck   ],[CovPatio  ],[Deck      ],[DETGAR    ],[EncPorch  ],[GAZEBO    ],[hobby_barn],[learn_to],[LoafingShd],[MACHINE   ],[Patio     ],[POLEBLDG  ],[POOL      ]
      ,[SHED      ],[unfinished_basement]
  FROM [pacs_oltp].[dbo].[__aIdt])as idt
		on idt.prop_id=id.prop_id

left JOIN
	pacs_oltp.dbo.imprv_adj iadj 
		ON id.prop_id = iadj.prop_id
LEFT JOIN 
	[pacs_oltp].[dbo].land_detail 
		ON property.prop_id = land_detail.prop_id --AND land_detail.prop_val_yr-- = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
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
	[Benton_spatial_data].[dbo].[PARCEL_FEMA] fema on pv.prop_id=fema.prop_id
left join 
	[Benton_spatial_data].[dbo].[PARCEL_SCHOOLDISTRICT] sd on pv.prop_id =sd.prop_id
left join 
	[pacs_oltp].[dbo].zoning z on pv.prop_id =z.prop_id
--left join [Benton_spatial_data].[dbo].[PARCEL_ZONING] lu on pv.prop_id=lu.prop_id
left join
	[pacs_oltp].[dbo].owner o
		on  pv.prop_id = o.prop_id  and pv.prop_val_yr = o.owner_tax_yr and pv.sup_num = o.sup_num
inner  join
	[pacs_oltp].[dbo].account a
		on o.owner_id=a.acct_id
LEFT JOIN 
	(SELECT vw.prop_id, ROW_NUMBER() over (partition by vw.prop_id ORDER BY vw.bldg_permit_id DESC) AS order_id,vw.bldg_permit_status, vw.bldg_permit_issue_dt, vw.bldg_permit_active, building_permit.bldg_permit_cmnt,
		building_permit.bldg_permit_desc, vw.bldg_permit_num, building_permit.bldg_permit_dt_complete
			FROM [pacs_oltp].[dbo].BUILDING_PERMIT_VW as vw
LEFT JOIN 
	[pacs_oltp].[dbo].building_permit 
		ON vw.bldg_permit_id = building_permit.bldg_permit_id
			WHERE prop_id IS NOT NULL ) as permits 
				ON land.prop_id = permits.prop_id AND permits.order_id = 1
LEFT JOIN 
	[pacs_oltp].[dbo].wash_prop_owner_tax_area_assoc AS wta WITH (nolock) 
		ON wta.year = pv.prop_val_yr AND wta.prop_id = pv.prop_id AND wta.sup_num = pv.sup_num 
left join
	pacs_oltp.dbo.tax_area AS ta WITH (nolock) 
		ON ta.tax_area_id = wta.tax_area_id
left join
	(select * from
	__aImage_Skt ) as images 
				ON land.prop_id = images.prop_id --AND images.order_id = 1


				WHERE land.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)  
			and pv.prop_inactive_dt is null	--and situs.primary_situs= 'Y'
			and pv.sup_num=0
			
		--and pv.property_use_cd between '21' and '39'
		--and pv.property_use_cd='13'
		--and pv.property_use_cd not like '14'and pv.property_use_cd not like '18'and pv.property_use_cd not like '11'
		--and pv.hood_cd like '1%'
		--and pv.hood_cd like '5%'
		--and pv.hood_cd like '6%'
		--and pv.hood_cd is null
		--and pv.sub_type = 'lh'
		--and sales.sl_dt>='01/01/2016'
		--and sales.sl_ratio_type_cd='00'
		--and pv.prop_id=282910
		--and pv.cycle=1
	--	and pv.prop_id=39315

GO

