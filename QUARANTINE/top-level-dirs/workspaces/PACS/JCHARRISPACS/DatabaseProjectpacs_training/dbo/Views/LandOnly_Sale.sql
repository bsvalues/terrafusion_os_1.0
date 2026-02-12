create view LandOnly_Sale as
SELECT [hood_land_pct]
      ,[hood_imprv_pct]
      ,[nbhd_changed_flag]
      ,[abs_imprv_pct]
      ,[abs_land_pct]
      ,[subdv_changed_flag]
      ,[prop_id]
      ,[owner_tax_yr]
      ,[abs_subdv_cd]
      ,[hood_cd]
  FROM [pacs_oltp].[dbo].[land_mass_adj_vw]
  where owner_tax_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

