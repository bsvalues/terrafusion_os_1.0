create view __aLand_Segment_Values as
SELECT  [ParcelID]
      ,[Sum_Land_Segments]
      ,[Legal_Acreage]
      ,[Sum_Segment_Market]
	   ,case when Sum_Segment_Market > 0 and [Legal_Acreage]>0 
	   then CAST(ROUND(([Sum_Segment_Market]/[Legal_Acreage]), 2) as decimal(10, 2)) else 0 end as Value_Per_acre
      ,[Total_Ag_UnitPrice]
      ,[conversion_balancing]
      ,[Land_for_Farm_Buildings]
      ,[Rangeland]
      ,[non_buildable]
      ,[OS_Market]
      ,[SecondaryComm_Indust_Land]
      ,[Irr_Pasture]
      ,[Primary_Commercial_Industrial_land]
      ,[Homesite]
      ,[Irr_Agland]
      ,[Utility_easement]
      ,[Utility_Towers]
      ,[Land_in_Transition]
      ,[Rural_Undeveloped]
      ,[Dry_Pasture]
      ,[Easement]
      ,[Dry_Agland]
      ,[Common_Areas]
	  ,Shape,XCoord,YCoord
  FROM [pacs_oltp].[dbo].[__Land_Segments]ls
  
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	  shape,[Shape].STCentroid().STX as XCoord,[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON ls.[ParcelID] = coords.Prop_ID AND coords.order_id = 1
				WHERE ls.prop_val_yr = (select appr_yr  from pacs_oltp.dbo.pacs_system)

GO

