create view levy_cert_cont_limit_yr as 
SELECT [levy_cert_run_id]
      ,[year]
      ,[tax_area_id]
      ,[tax_area_number]
      ,[tax_area_description]
      ,[status]
      ,[original_levy_rate]
      ,[levy_reduction]
      ,[final_levy_rate]
      ,[original_senior_levy_rate]
      ,[senior_levy_reduction]
      ,[final_senior_levy_rate]
  FROM [pacs_oltp].[dbo].[levy_cert_const_limit_summary_vw]
  where year=(Select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

