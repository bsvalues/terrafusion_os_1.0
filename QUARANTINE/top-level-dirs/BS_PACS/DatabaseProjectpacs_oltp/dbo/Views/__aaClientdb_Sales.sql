create view __aaClientdb_Sales as
SELECT [chg_of_owner_id]
      ,cld.[prop_id]
      ,[prop_type_cd]
      ,[property_type]
      ,[state_cd]
      ,[school_id]
      ,[city_id]
      ,[imprv_class]
      ,[actual_yr_built]
      ,[living_area_sqft]
      ,[land_type_cd]
      ,convert(char(20), [sale_dt], 101)AS SaleDate
	  ,YEAR([sale_dt]) as sales_year
      ,[sl_price]
      ,[sl_adj_price]
      ,[sl_type_cd]
      ,[land_only_sale]
      ,[include_no_calc]
      ,[sl_ratio_cd]
      ,[eff_yr_built]
      ,[include_reason]
      ,[geo_id]
      ,[simple_geo_id]
      ,[sl_adj_reason]
      ,[true_sl_price]
      ,[local_dor_code]
      ,[living_area_sqft2]
      ,[living_area]
      ,[imprv_sub_class]
      ,[condition_cd]
      ,[heat_ac_code]
      ,[land_total_sqft]
      ,[land_total_acres]
      ,[additive_val]
      ,[percent_complete]
      ,[sub_market_cd]
      ,[imprv_type_cd]
      ,[imprv_det_meth_cd]
      ,[imprv_det_sub_class_cd]
      ,[state_dor_code]
      ,[tax_area_number]
      ,[tax_area_id]
      ,[zoning]
      ,[mh_make]
      ,[mh_model]
      ,[mh_serial]
      ,[mh_hud]
      ,[mh_title]
      ,[multi_prop_sale]
      ,[market]
      ,[excise_number]
      ,[deed_type_cd]
      ,[deed_num]
      ,[deed_book_id]
      ,[deed_book_page]
      ,[deed_dt]
      ,[grantor_cv]
      ,[grantee_cv]
      ,[seller]
      ,[buyer]
      ,[current_owner]
      ,[prop_type_desc]
      ,[situs_display]
      ,[legal_desc]
      ,[owner_name]
      ,[tax_area]
      ,[prop_val_yr]
      ,[show_values]
      ,[abs_subdv_cd]
  
  , XCoord,YCoord,Shape
 FROM [web_internet_benton].[dbo].[_clientdb_sales] cld

  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON cld.prop_id = coords.Prop_ID
	where prop_val_yr=(select appr_yr  from pacs_oltp.dbo.pacs_system)

GO

