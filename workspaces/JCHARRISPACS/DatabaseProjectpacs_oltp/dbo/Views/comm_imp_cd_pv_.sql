create view comm_imp_cd_pv_ as 
SELECt [imp_type]
      ,[const_code]
      ,[all_except]
      ,[code_type]
      ,[valid_code]
      ,[field_name]
      ,[default_value]
  FROM [cnv_src_benton_2_14_2017].[dbo].[comm_imp_codes]

GO

