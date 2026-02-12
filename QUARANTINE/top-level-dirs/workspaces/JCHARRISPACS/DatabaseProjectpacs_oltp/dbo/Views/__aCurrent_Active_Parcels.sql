create view __aCurrent_Active_Parcels as 
SELECT [__current_active_parcels].[prop_id]
      ,[prop_val_yr]
      ,[alt_dba_name]
      ,[geo_id]
      ,[prop_type_cd]
      ,[state_cd]
      ,[remarks]
      ,[hood_cd]
      ,[tract_or_lot]
      ,[eff_size_acres]
      ,[sub_type]
      ,[orig_appraised_val]
      ,[property_type]
      ,[property_type_desc]
      ,[appraised_val]
      ,[market]
      ,[cycle]
      ,[property_use_cd]
      ,[LandVal]
      ,[ImprvVal]
      ,[ag_market]
      ,[ag_use_val]
      ,[prop_inactive_dt]
      ,[mass_created_from]
      ,[map_id]
      ,[mapsco]
      ,[value_appraiser_id]
      ,[sup_num]
      ,[commercial]
      ,[boat]
      ,[prop_type]
      ,[farm]
      ,[industrial]
      ,[property_sub_cd]
      ,[property_sub_desc]
      ,[local_assessed_utility]
	  ,XCoord,YCoord
  FROM [pacs_oltp].[dbo].[__current_active_parcels]
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON [__current_active_parcels].prop_id = coords.Prop_ID AND coords.order_id = 1

GO

