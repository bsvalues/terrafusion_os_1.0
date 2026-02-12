create view __aleased_land as 
SELECT  [prop_id]
      ,[prop_val_yr]
      ,[is_leased_land_property]
  FROM [web_internet_benton].[dbo].[property_leased_land_vw]
  where prop_val_yr=2019 and is_leased_land_property = '1'

GO

