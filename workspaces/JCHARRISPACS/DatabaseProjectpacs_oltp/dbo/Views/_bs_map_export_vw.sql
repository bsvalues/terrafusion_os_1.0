

create view [dbo].[_bs_map_export_vw]
as
SELECT  [Benton_spatial_data].[dbo].[map_export].[prop_id]
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
      ,[jurisdictions]
      ,[owner_address1]
      ,[owner_address2]
      ,[owner_address3]
      ,[city]
      ,[state]
      ,[zip]
      ,[country]
  FROM [Benton_spatial_data].[dbo].[map_export]
  left join
  (SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
 [CENTROID_X]as XCoord,
      [CENTROID_Y]  as YCoord 


FROM 
[Benton_spatial_data].[dbo].[PARCEL]
) as coords
 
ON 

[Benton_spatial_data].[dbo].[map_export].prop_id = coords.Prop_ID AND coords.order_id = 1

WHERE 
prop_val_yr = --2018
(select appr_yr  from pacs_oltp.dbo.pacs_system)  


--AND XCoord IS NOT NULL 

GO

