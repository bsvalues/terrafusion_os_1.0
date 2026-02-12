create view codes_tble_pv as 
SELECT  [id]
      ,[code_category_id]
      ,[code_table_cd]
      ,[code_description]
      ,[chg_allowed_ind]
      ,[print_order]
      ,[mod_date]
      ,[state]
  FROM [cnv_src_benton_2_14_2017].[dbo].[code_table]

GO

