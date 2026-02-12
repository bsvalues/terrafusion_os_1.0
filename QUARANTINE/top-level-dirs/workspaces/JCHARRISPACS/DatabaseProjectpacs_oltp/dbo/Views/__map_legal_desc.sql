create view  __map_legal_desc as 

SELECT DISTINCT 
[prop_id],
[prop_val_yr],
rtrim(legal_desc)													as legal_desc
FROM 
[web_internet_benton].[dbo].[_clientdb_property] 
where 
prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)--;",

GO

