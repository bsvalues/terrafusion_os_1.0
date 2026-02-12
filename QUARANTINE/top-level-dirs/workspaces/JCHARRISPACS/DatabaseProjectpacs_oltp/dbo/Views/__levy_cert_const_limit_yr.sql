create view __levy_cert_const_limit_yr as 
SELECT [levy_cert_run_id]
      ,[year]
      ,[tax_district_id]
      ,[levy_cd]
      ,[status]
      ,[original_levy_rate]
      ,[levy_reduction]
      ,[final_levy_rate]
      ,[original_senior_levy_rate]
      ,[senior_levy_reduction]
      ,[final_senior_levy_rate]
  FROM [pacs_oltp].[dbo].[levy_cert_const_limit]
  where year=(Select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

