
create view [dbo].[taxing_jurisdiction_ap_yr] as 
SELECT  [prop_id]
      ,[owner_prop_id]
      ,[sup_yr]
      ,[owner_id]
      ,[entity_id]
      ,[owner_name]
      ,[pct_ownership]
      ,[total_market]
      ,[total_appraised_val]
      ,[total_assessed_val]
      ,[entity_cd]
      ,[file_as_name]
      ,[tax_rate]
      ,[appraised_val]
      ,[assessed_val]
      ,[taxable_val]
      ,[freeze_ceiling]
      ,[show_values]
      ,[homesite_val]
      ,[nonhomesite_val]
      ,[tax_area_id]
      ,[tax_district_id]
      ,[levy_rate]
      ,[levy_cd]
      ,[levy_description]
      ,[taxes]
      ,[taxes_wo_ex]
      ,[certification_dt]
      ,[max_freeze]
      ,[confidential_flag]
      ,[tax_area]
  FROM [web_internet_benton].[dbo].[clientdb_taxing_jurisdiction_detail_vw]
  where sup_yr =--(select tax_yr from pacs_oltp.dbo.pacs_system)
  (select appr_yr from pacs_oltp.dbo.pacs_system)

GO

