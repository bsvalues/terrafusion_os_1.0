create view __levy_cert_levy_data_limit_yr as 
SELECT [levy_cert_run_id]
      ,[year]
      ,[tax_district_id]
      ,[tax_district_name]
      ,[levy_cd]
      ,[levy_description]
      ,[levy_type_cd]
      ,[levy_type_desc]
      ,[voted]
      ,[timber_assessed_full]
      ,[timber_assessed_half]
      ,[timber_assessed_roll]
      ,[budget_amount]
      ,[tax_base]
      ,[levy_rate]
      ,[outstanding_item_cnt]
  FROM [pacs_oltp].[dbo].[levy_cert_levy_data_vw]
  where year=(Select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

