create view __client_map_not_appr_yr as
SELECT cld.[prop_id]
      ,[prop_val_yr]
      ,[geo_id]
      ,[prop_type_cd]
      ,[prop_type_desc]
      ,[dba_name]
      ,[appraised_val]
      ,[abs_subdv_cd]
      ,[mapsco]
      ,[map_id]
      ,[agent_cd]
      ,[hood_cd]
      ,[hood_name]
      ,[owner_name]
      ,[owner_id]
      ,[pct_ownership]
      ,[exemptions]
      ,[state_cd]
      ,[legal_desc]
      ,[situs]
      ,[jurisdictions],XCoord,YCoord,Shape
  FROM [web_internet_benton].[dbo].[clientdb_map_vw] cld
    LEFT JOIN 
(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord , shape
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON cld.prop_id = coords.Prop_ID
	where prop_val_yr=(select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

