create view yr_to_yr as 
SELECT  cp.[prop_id]
      ,[year_one]
      ,[market_val_yr_one]
      ,[year_two]
      ,[market_val_yr_two]
      ,[percent_change]
      ,[new_val]
      ,[last_yr_blt]
      ,[property_use_cd]
      ,[region]
      ,[neighborhood]
	  ,XCoord,YCoord
  FROM [pacs_oltp].[dbo].[yr_by_yr_prop_val_comp_vw] cp
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
[Benton_spatial_data].[dbo].[PARCEL_SP]) sp on sp.Prop_ID=cp.Prop_ID
  --where year_one=2019  and year_two=2018

GO

