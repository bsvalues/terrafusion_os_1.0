--Land Sub Query
create view AP_LAND as 
SELECT
prop_id, 
SUM(size_acres) as size_acres
,prop_val_yr
,state_cd
			
FROM 
	[pacs_oltp].[dbo].land_detail 

GROUP BY 
prop_id
,prop_val_yr
,state_cd

GO

