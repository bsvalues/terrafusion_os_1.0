create view __aClientdb_land_detail as
SELECT  cld.[prop_id]
      ,[prop_val_yr]
      ,[land_seg_id]
      ,[land_type_cd]
      ,[land_type_desc]
      ,[size_acres]
      ,[size_square_feet]
      ,[effective_front]
      ,[effective_depth]
      ,[land_seg_mkt_val]
      ,[ag_val]
      ,[show_values]
	  ,XCoord,ycoord,shape
  FROM [web_internet_benton].[dbo].[_clientdb_land_detail] cld
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON cld.prop_id = coords.Prop_ID
	where prop_val_yr=(select appr_yr  from pacs_oltp.dbo.pacs_system)

GO

