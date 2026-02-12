Create view __aMap_Export as
SELECT  [clientdb_map_export_vw].[prop_id]     
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
      ,[jurisdictions]
      ,[owner_address1]
      ,[owner_address2]
      ,[owner_address3]
      ,[city]
      ,[state]
      ,[zip]
      ,[country]
	  ,coords.xcoord
	  ,coords.ycoord
  FROM [web_internet_benton].[dbo].[clientdb_map_export_vw]
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords on coords.prop_id=[clientdb_map_export_vw].prop_id

  where prop_val_yr=(select appr_yr from [pacs_oltp].[dbo].pacs_system) 
  and coords.xcoord is not null

GO

