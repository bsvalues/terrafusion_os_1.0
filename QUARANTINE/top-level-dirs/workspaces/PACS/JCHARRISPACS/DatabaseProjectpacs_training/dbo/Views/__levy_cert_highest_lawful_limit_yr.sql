create view __levy_cert_highest_lawful_limit_yr as 
SELECT  [levy_cert_run_id]
      ,[year]
      ,[tax_district_id]
      ,[levy_cd]
      ,[levy_year]
      ,[highest_lawful_levy]
  FROM [pacs_oltp].[dbo].[levy_cert_highest_lawful_levy_history]
  where year=(Select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

