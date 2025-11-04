  create view __aClientdb_sketch as
SELECT  [id]
      ,cld.[prop_id]
      ,[prop_val_yr]
      ,[imprv_id]
      ,[image_path]as sketch_path
  FROM [web_internet_benton].[dbo].[_clientdb_property_sketch]cld
    LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON cld.prop_id = coords.Prop_ID
	where prop_val_yr=(select appr_yr  from pacs_oltp.dbo.pacs_system)

GO

