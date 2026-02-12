create view Current_Neighborhood as
SELECT  [hood_cd]
      ,[hood_yr]
      ,[hood_name]
      ,[hood_land_pct]
      ,[hood_imprv_pct]
      ,[sys_flag]
      ,[changed_flag]
      ,[reappraisal_status]
      ,[life_cycle]
      ,[phys_comment]
      ,[eco_comment]
      ,[gov_comment]
      ,[soc_comment]
      ,[inactive]
      ,[inactive_date]
      ,[created_date]
      ,[cycle]
      ,[nbhd_descr]
      ,[nbhd_comment]
      ,[ls_id]
      ,[appraiser_id]
      ,[comments]
  FROM [pacs_oltp].[dbo].[neighborhood]
  where hood_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

