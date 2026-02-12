
create view [dbo].[__BCZoning] as 
SELECT bcz.[Prop_ID]
      ,[zoning]
	  ,XCoord
	  ,YCoord
  FROM [pacs_oltp].[dbo].[__BentonCoZoning] bcz

  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[shape].STCentroid().STX as XCoord,[shape].STCentroid().STY as YCoord ,[CENTROID_X] as x
      ,[CENTROID_Y] as y
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON bcz.prop_id = coords.Prop_ID AND coords.order_id = 1

GO

