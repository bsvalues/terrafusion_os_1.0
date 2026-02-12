create view __Levy_cert_levy_review_limit_yr_1 as 
SELECT  [levy_cert_run_id]
      ,[year]
      ,[tax_district_id]
      ,[levy_cd]
      ,[tax_district_name]
      ,[tax_district_type]
      ,[levy_description]
      ,[levy_type_desc]
      ,[final_levy_rate]
      ,[final_senior_levy_rate]
  FROM [pacs_oltp].[dbo].[levy_cert_review_vw]
  where year=(Select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

