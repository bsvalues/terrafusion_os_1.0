create view __DOR_exempt as 
SELECT  [prop_id]
      ,[owner_id]
      ,[exmpt_tax_yr]
      ,[owner_tax_yr]
      ,[prop_type_cd]
      ,[exmpt_type_cd]
      ,[applicant_nm]
      ,[sup_num]
      ,[effective_tax_yr]
      ,[qualify_yr]
      ,[sp_date_approved]
      ,[sp_expiration_date]
      ,[sp_comment]
      ,[sp_value_type]
      ,[sp_value_option]
      ,[absent_flag]
      ,[absent_expiration_date]
      ,[absent_comment]
      ,[deferral_date]
      ,[apply_local_option_pct_only]
      ,[apply_no_exemption_amount]
      ,[exmpt_subtype_cd]
      ,[exemption_pct]
  
  FROM [pacs_oltp].[dbo].[property_exemption]
  where owner_tax_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
  and exmpt_subtype_cd='dor'

GO

