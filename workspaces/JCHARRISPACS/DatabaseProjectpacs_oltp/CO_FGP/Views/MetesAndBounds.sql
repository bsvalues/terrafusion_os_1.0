CREATE VIEW [CO\FGP].MetesAndBounds AS SELECT [prop_val_yr]
      ,[sup_num]
      ,[prop_id]
      ,[metes_and_bounds]
  FROM [pacs_oltp].[dbo].[property_legal_description]
  where prop_val_yr=2019

GO

