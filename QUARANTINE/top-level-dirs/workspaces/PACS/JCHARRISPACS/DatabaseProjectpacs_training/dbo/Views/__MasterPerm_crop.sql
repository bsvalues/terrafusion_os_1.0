
create view __MasterPerm_crop as 


SELECT [ParcelID]
      ,[MapNumber]
      ,[file_as_name]
      ,[situs_display]
	   ,order_id as crop_order
	  ,Year_Planted 
	  ,imprv_det_meth_cd
	  ,imprv_det_type_cd as crop
	  ,imprv_pc_acres as crop_acres
	  ,NBHD
	  ,state_code
	  ,Irrigated_Acres
	  ,Total_Legal_Acres
	  ,[Flat/Adjusted Value]
	  ,Current_Imprv_Det_Val
	  ,Current_Flat
      ,[tax_area]
      ,[subset_cd]
      ,[next_appraiser]
      ,[last_appraiser]
      ,[imprv_val_yr_before]
      ,[imprv_val_yr_after]
      ,[imprv_percent_change]
      ,[land_val_yr_before]
      ,[land_val_yr_after]
      ,[land_percent_change]
      ,[SaleDate]
      ,[OriginalSalePrice]
      ,[excise_number]
      ,[deed_type_cd]
      ,[TotalAcres]
      ,[TotalMarketValue]
      ,[PreviousMarket]
      ,[TotalAsessedValue]
      ,[PreviousAsessedValue]
      ,[LandVal]
      ,[PreviousLandVal]
      ,[ImpVal]
      ,[PreviousImpVal]
      ,[AppraisedValue]
      ,[PreviousAppraisedValue]
      ,[new_value]
      ,[neighborhood]
      ,[section]
      ,[township]
      ,[range]
      ,[legal_acres]
      ,[land_sqft]
      ,[zoning]
      ,[land_front_feet]
      ,[Reval]
      ,[abs_subdv_cd]
      ,[abs_subdv_desc]
      ,[property_use_cd]
      ,[prop_type_cd]
      ,[PrimaryImprovement]
      ,[sub_type]
      ,[Roofing]
      ,[Heating]
      ,[ExtWall]
      ,[Style]
      ,[TotalArea]
      ,[YearBuilt]
      ,[Condition]
      ,[Bathrooms]
      ,[HalfBaths]
      ,[attached_garage]
      ,[detached_garage]
      ,[finished_basement]
      ,[unfinished_basement]
      ,[Total_Basement]
      ,[carport]
      ,[Pole_building]
      ,[sl_ratio_type_cd]
      ,[sl_county_ratio_cd]
      ,[adjusted_sl_price]
      ,[chg_of_owner_id]
      ,[land_only_sale]
      ,[sl_land_unit_price]
      ,[sl_type_cd]
      ,[imprv_val_source]
      ,[new_val]
      ,[stories]
      ,[num_imprv]
      ,[imprv_state_cd]
      ,[fireplace]
      ,[foundation]
      ,[fireplace_count]
      ,[FixtureCount_Cost]
      ,[eff_yr_blt]
      ,[Age]
      ,[land_unit_price]
      ,[main_land_unit_price]
      ,[class_cd]
      ,[class_subclass_cd]
      ,[pre_subclass_cd]
      ,[percent_complete]
      ,[imprv_unit_price]
      ,[heat_ac_code]
      ,[land_table]
      ,[details_unit_price]
      ,[imprv_det_cost_unit_price]
      ,[net_rentable_area]
      ,[permit_status]
      ,[permit_issue_date]
      ,[permit_complete_date]
      ,[permit_num]
      ,[permit_desc]
      ,[permit_cmnt]
      ,[active_permits]
      ,[img_path]
      ,[XCoord]
      ,[YCoord]
      ,[x]
      ,[y]
	  
  FROM [pacs_oltp].[dbo].[master_spatial] as ms

  inner join 

  (SELECT id.prop_id, p.geo_id as 'Geo_ID',
ROW_NUMBER() over (partition by id.prop_id ORDER BY id.imprv_det_type_cd desc)AS order_id, id.imprv_det_type_cd,id.yr_built as 'Year_Planted',
ID.imprv_det_meth_cd, 
Sum(case when   id.imprv_det_type_cd IS not null	
	then	( permanent_crop_acres  )	else	null	end) as	imprv_pc_acres ,pv.cycle as 'Cycle', pv.hood_cd as 'NBHD', imprv.imprv_state_cd as 'State_Code',pv.legal_acreage as 'Total_Legal_Acres',ac.file_as_name as 'Owner',


id.permanent_crop_irrigation_acres as 'Irrigated_Acres',
id.imprv_det_val_source as 'Flat/Adjusted Value',
id.imprv_det_flat_val as 'Current_Flat', 
id.imprv_det_calc_val as 'Current_Imprv_Det_Val'

	,centroid_x,centroid_y,X_Coord,Y_Coord

 FROM           pacs_oltp.dbo.imprv_detail  id 
  INNER JOIN
                         pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 
						 INNER JOIN pacs_oltp.dbo.owner o  ON	pv.prop_id = o.prop_id
						 INNER JOIN pacs_oltp.dbo.property p WITH (nolock) ON
	pv.prop_id = p.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN pacs_oltp.dbo.account ac WITH (nolock) ON
	o.owner_id = ac.acct_id


inner join 

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [Prop_ID]DESC) 
AS order_id,
[Prop_ID]
,[Shape]
,geometry
--,[XCoord]
--,[YCoord]
,[Geometry].STCentroid().STX as X_Coord
,[Geometry].STCentroid().STY as Y_Coord 
,[Shape_Area]
,[Shape_Leng]
,[CENTROID_X]
,[CENTROID_Y]
FROM 
[Benton_spatial_data].[dbo].[spatial_Parcel]
where Prop_ID> 0 


) sp 

 on pv.prop_id=sp.prop_id

			

where 
id.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and id.sale_id=0
and 
imprv.imprv_type_cd='permc'
--and id.imprv_det_meth_cd not like 'irr'
--and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=26521
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and permanent_crop_acres is not null 
group by 
id.prop_id,id.imprv_det_id,id.imprv_det_type_cd,permanent_crop_acres,ID.imprv_det_meth_cd,centroid_x,centroid_y,p.geo_id  ,pv.cycle , pv.hood_cd , imprv.imprv_state_cd ,pv.legal_acreage ,ac.file_as_name,
id.yr_built ,
id.permanent_crop_acres ,
id.permanent_crop_irrigation_acres,
id.imprv_det_val_source,
id.imprv_det_flat_val, 
id.imprv_det_calc_val,X_Coord,Y_Coord) sp on sp.prop_id=ms.[ParcelID]

GO

