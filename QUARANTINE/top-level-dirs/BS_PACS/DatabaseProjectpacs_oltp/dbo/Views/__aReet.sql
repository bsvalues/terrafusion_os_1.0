create view __aReet as 
SELECt [id]
      ,Coords.[prop_id]
      ,[year]
      ,[image_path]
      ,[image_nm]
      ,[image_type]
	  ,coords.XCoord, coords.YCoord,Shape
  FROM [web_internet_benton].[dbo].[_clientdb_property_image]
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],shape,

	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 

		FROM [Benton_spatial_data].[dbo].[parcel]) coords  on coords.prop_id=[web_internet_benton].[dbo].[_clientdb_property_image].prop_id
  where
  image_type like 'reet'

GO

