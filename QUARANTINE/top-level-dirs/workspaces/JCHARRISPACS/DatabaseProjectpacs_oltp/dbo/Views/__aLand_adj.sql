create view __aLand_adj as
SELECT  lav.[prop_id]
      ,[prop_val_yr]
      ,[sup_num]
      ,[sale_id]
      ,[land_seg_id]
      ,[land_seg_adj_seq]
      ,[land_value]
      ,[land_seg_adj_dt]
      ,[land_seg_adj_type]
      ,[land_seg_adj_desc]
      ,[land_seg_adj_cd]
      ,[land_seg_adj_pc]
      ,[land_adj_type_cd]
      ,[land_adj_type_desc]
      ,[land_adj_type_usage]
      ,[land_adj_type_amt]
      ,[land_adj_type_pct],XCoord,YCoord
  FROM [pacs_oltp].[dbo].[LAND_ADJ_VW]lav
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON lav.prop_id = coords.Prop_ID AND coords.order_id = 1

			where prop_val_yr=(select appr_yr from [pacs_oltp].[dbo].pacs_system)

GO

