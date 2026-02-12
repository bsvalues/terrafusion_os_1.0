create view __aClientdb_image as
SELECT  [id]
      ,cld.[prop_id]
      ,[year]
      ,[image_path]
      ,[image_nm]
      ,[image_type]
      ,[sub_type]
      ,[rec_type]
      ,[comment]
  FROM [web_internet_benton].[dbo].[_clientdb_property_image] cld
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON cld.prop_id = coords.Prop_ID
	where year=(select appr_yr  from pacs_oltp.dbo.pacs_system)

GO

