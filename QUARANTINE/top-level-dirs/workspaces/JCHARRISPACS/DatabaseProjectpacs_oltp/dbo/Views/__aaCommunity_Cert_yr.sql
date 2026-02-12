create view __aaCommunity_Cert_yr as 
SELECT cc.[prop_id]
      ,[block]
      ,[tract_or_lot]
      ,[legal_desc]
      ,[legal_desc_2]
      ,[township_section]
      ,[township_code]
      ,[range_code]
      ,[township_q_section]
      ,[cycle]
      ,[property_use_cd]
      ,[property_use_desc]
      ,[market]
      ,[land_hstd_val]
      ,[land_non_hstd_val]
      ,[imprv_hstd_val]
      ,[imprv_non_hstd_val]
      ,[hood_cd]
      ,[abs_subdv_cd]
      ,[appraised_val]
      ,[assessed_val]
      ,[legal_acreage]
      ,[prop_type_cd]
      ,[image_path]
      ,[geo_id]
      ,[isactive]
      ,[RowNum],XCoord,YCoord,Shape
  FROM [pacs_oltp].[dbo].[__aCommunity_Cert_yr] cc
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
			--where [__current_active_parcels].prop_id=14618

GO

