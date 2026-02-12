create view __aamobile_assignment_group as 
SELECT mm.[prop_id]
      ,[mobile_assignment_group_id]
      ,[abs_subdv]
      ,[map_id]
      ,[neighborhood]
      ,[region]
      ,[state_cd]
      ,[subset]
      ,[group_codes]
      ,[entities]
      ,[property_use_cd],XCoord,ycoord
  FROM [pacs_oltp].[dbo].[MM_assignment_group_prop_view]mm
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON mm.prop_id = coords.Prop_ID AND coords.order_id = 1
				--WHERE prop_val_yr =  (select appr_yr from [pacs_oltp].[dbo].pacs_system)

GO

