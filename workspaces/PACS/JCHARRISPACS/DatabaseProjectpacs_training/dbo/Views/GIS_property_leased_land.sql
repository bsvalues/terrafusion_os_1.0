create view GIS_property_leased_land as 
SELECT  [prop_id]
      ,[prop_val_yr]
      ,[is_leased_land_property]
  FROM [web_internet_benton].[dbo].[property_leased_land_vw]
 where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
 and is_leased_land_property>0

GO

