create view mm_owner as 
SELECT DISTINCT prop_id, owner_id 
	FROM [owner] 
	WHERE owner_tax_yr = 
		(select appr_yr from pacs_system)

GO

