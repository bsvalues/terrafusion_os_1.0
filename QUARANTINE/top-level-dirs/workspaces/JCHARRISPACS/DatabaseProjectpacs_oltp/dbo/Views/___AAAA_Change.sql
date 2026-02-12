create view ___AAAA_Change as 
SELECT  [prop_id]
      ,[cycle]
      ,[year_before]
      ,[market_val_yr_before]
      ,[year_after]
      ,[market_val_yr_after]
      ,[percent_change]
      ,[new_val]
      ,[property_use_cd]
      
      ,[hood_before]
      
      ,[hood_after]
      ,[abs_sub_after]
      
      ,[condition_after]
      ,[land_acres]
      ,[imprv_type_cd]
      ,[imprv_before]
      ,[imprv_after]
      ,[land_before]
      ,[land_after]

      ,[class_before]
      ,[class_after]

      ,[yr_blt]

      ,[imprv_percent_change]
       ,[land_percent_change]
  FROM [pacs_oltp].[dbo].[Current_Change]
  Where 
  [percent_change]<2.5

 --order by [percent_change]

GO

