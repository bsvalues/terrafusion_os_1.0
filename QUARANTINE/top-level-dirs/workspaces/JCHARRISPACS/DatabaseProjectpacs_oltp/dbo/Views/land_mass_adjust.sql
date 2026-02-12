create view land_mass_adjust as
SELECT [hood_land_pct]
      ,[hood_imprv_pct]
      ,[nbhd_changed_flag]
      ,[abs_imprv_pct]
      ,[abs_land_pct]
      ,[subdv_changed_flag]
      ,lm.[prop_id]
      ,[owner_tax_yr]
      ,[abs_subdv_cd]
      ,[hood_cd]
  FROM [pacs_oltp].[dbo].[land_mass_adj_vw] lm
  inner join 
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
[Benton_spatial_data].[dbo].[PARCEL_SP]) sp on sp.Prop_ID=lm.prop_id

  where owner_tax_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

