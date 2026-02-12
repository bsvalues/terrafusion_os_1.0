create view __aaland_det_new_value as
SELECT lnv.[prop_id]
      ,[prop_val_yr]
      ,[sup_num]
      ,[sale_id]
      ,[effective_tax_year]
      ,[land_seg_homesite]
      ,[sum_land_new_hs_val],XCoord,ycoord
  FROM [pacs_oltp].[dbo].[land_detail_new_value_vw]lnv
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON lnv.prop_id = coords.Prop_ID AND coords.order_id = 1


  where prop_val_yr=(select appr_yr from [pacs_oltp].[dbo].pacs_system)

GO

