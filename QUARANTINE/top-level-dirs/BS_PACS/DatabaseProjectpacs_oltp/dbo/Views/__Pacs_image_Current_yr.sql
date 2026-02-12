create view __Pacs_image_Current_yr as 
SELECt [id]
      ,[prop_id]
      ,[year]
      ,[image_path]
      ,[image_nm]
      ,[image_type]
  FROM [web_internet_benton].[dbo].[_clientdb_property_image]
  where year=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

