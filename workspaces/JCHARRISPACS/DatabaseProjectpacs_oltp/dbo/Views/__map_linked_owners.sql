create view  __map_linked_owners as

SELECT prop_id, file_as_name, 
owner_desc FROM [pacs_oltp].[dbo].[prop_linked_owner]	as prop_ow
LEFT JOIN 
account 
ON 
prop_ow.owner_id = account.acct_id
WHERE 
prop_val_yr = (select appr_yr from pacs_system)

GO

