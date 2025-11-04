--Declare @quality as int
--declare @sub_quality as int ;
create view  __quality as 
SELECT 
      [prop_id],
   quality + sub_quality  as new_class_cd 
   
  FROM [pacs_oltp].[dbo].[__new_quality]

GO

