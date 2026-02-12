


CREATE VIEW dbo.appr_card_entity_vw
AS
SELECT 	entity_prop_assoc.prop_id, entity_prop_assoc.entity_id, 
    	entity_prop_assoc.entity_prop_pct, 
    	entity_prop_assoc.sup_num, entity_prop_assoc.tax_yr, 
    	entity.entity_cd, account.file_as_name
FROM 	entity 
	INNER JOIN account ON 
		entity.entity_id = account.acct_id 
	RIGHT OUTER JOIN entity_prop_assoc ON 
		entity.entity_id = entity_prop_assoc.entity_id

GO

