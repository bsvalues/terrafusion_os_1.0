Create view _apMetes_and_bounds_Appr_yr as 
sELECT [prop_val_yr]
      ,[sup_num]
      ,cc.[prop_id]
      ,[metes_and_bounds],XCoord,YCoord,shape
  FROM [Benton_spatial_data].[dbo].[legal_metes_and_bounds_current]cc

     LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON cc.prop_id = coords.Prop_ID AND coords.order_id = 1

GO

