create view  __map_roll_value_history as

SELECT * 
FROM
[web_internet_benton].[dbo].[_clientdb_roll_value_history_detail] 
WHERE 
prop_val_yr < year(GETDATE())--;",

GO

