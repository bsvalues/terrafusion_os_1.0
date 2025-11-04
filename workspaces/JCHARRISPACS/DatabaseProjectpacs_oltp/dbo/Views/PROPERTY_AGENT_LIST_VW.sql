


CREATE VIEW dbo.PROPERTY_AGENT_LIST_VW
AS
SELECT agent_assoc.agent_id, agent_assoc.owner_id, 
    account.file_as_name AS agent_file_as_name, 
    owner_acct.file_as_name AS owner_file_as_name, 
    prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, agent_assoc.auth_to_protest,
    pv.udi_parent_prop_id, pv.udi_parent, pv.prop_inactive_dt
FROM prop_supp_assoc INNER JOIN
    agent_assoc INNER JOIN
    account ON 
    agent_assoc.agent_id = account.acct_id INNER JOIN
    account owner_acct ON 
    agent_assoc.owner_id = owner_acct.acct_id ON 
    prop_supp_assoc.prop_id = agent_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = agent_assoc.owner_tax_yr
	INNER JOIN property_val pv on
	pv.prop_id = prop_supp_assoc.prop_id and
	pv.prop_val_yr = prop_supp_assoc.owner_tax_yr and
	pv.sup_num = prop_supp_assoc.sup_num

GO

