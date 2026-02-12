create view __Pacs_REET_ as 
SELECt [id]
      ,[prop_id]
      ,[year]
      ,[image_path]
      ,[image_nm]
      ,[image_type]
  FROM [web_internet_benton].[dbo].[_clientdb_property_image]
  where
  image_type like 'reet'

GO

