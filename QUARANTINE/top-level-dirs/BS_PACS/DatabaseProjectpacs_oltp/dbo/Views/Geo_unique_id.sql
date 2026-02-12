
create view Geo_unique_id
as

  SELECT 
    ROW_NUMBER() OVER (ORDER BY geo_id) AS UniqueID,
     geo_id,
    prop_id, prop_type_cd

 FROM [pacs_oltp].[dbo].[property]
where prop_type_cd='R'

GO

