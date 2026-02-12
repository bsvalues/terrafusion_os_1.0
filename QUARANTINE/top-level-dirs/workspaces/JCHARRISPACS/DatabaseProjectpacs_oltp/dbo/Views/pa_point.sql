create view pa_point as

  SELECT    
		[Prop_ID]   
      ,[Parcel_ID]
      
      ,[Image]
      ,[Sketch]
      ,[owner_name]
      ,[legal_desc]
      ,[owner_address]
      ,[situs_address]
      ,[tax_code_area]
      ,[neighborhood_name]
      ,[neighborhood_code]
      ,[legal_acres]
      ,[land_sqft]
      ,[year_blt]
      ,[primary_use]
      ,[cycle]
	  ,[OBJECTID]
      ,[Shape]
	  ,[CENTROID_X]
      ,[CENTROID_Y]

  FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]

GO

