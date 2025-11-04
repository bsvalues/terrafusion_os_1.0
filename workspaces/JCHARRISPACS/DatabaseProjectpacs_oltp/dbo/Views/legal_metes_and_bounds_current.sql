

create view 

legal_metes_and_bounds_current
as
SELECT [prop_val_yr]
      ,[sup_num]
      ,[prop_id]
      ,[metes_and_bounds]
  FROM [pacs_oltp].[dbo].[property_legal_description]
  where prop_val_yr=(select appr_yr from [pacs_oltp].[dbo].[pacs_system])

GO

