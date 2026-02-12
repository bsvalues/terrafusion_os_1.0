
CREATE VIEW dbo.PROPERTY_AGENT_VW
AS
SELECT agent_assoc.owner_tax_yr, agent_assoc.agent_id, 
    agent_assoc.arb_mailings, agent_assoc.prop_id, 
    property_type.prop_type_desc, property_val.legal_desc, 
    agent_assoc.ca_mailings, agent_assoc.owner_id, 
    agent_assoc.expired_dt_tm, agent_assoc.ent_mailings, 
    agent_assoc.appl_dt, agent_assoc.eff_dt, agent_assoc.exp_dt, 
    agent_assoc.agent_cmnt, account.acct_id, 
    account.first_name AS agent_first_name, 
    account.last_name AS agent_last_name, 
    account.file_as_name AS agent_file_as_name, 
    owner_acct.first_name AS owner_first_name, 
    owner_acct.last_name AS owner_last_name, 
    owner_acct.file_as_name AS owner_file_as_name, 
    agent_assoc.auth_to_protest, agent_assoc.auth_to_resolve, 
    agent_assoc.auth_confidential, agent_assoc.auth_other, 
    account.ref_id1,
    property.geo_id,
    property_val.prop_inactive_dt
FROM property_type INNER JOIN
    property ON 
    property_type.prop_type_cd = property.prop_type_cd INNER JOIN
    property_val ON 
    property.prop_id = property_val.prop_id INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
    agent_assoc INNER JOIN
    account ON 
    agent_assoc.agent_id = account.acct_id INNER JOIN
    account owner_acct ON 
    agent_assoc.owner_id = owner_acct.acct_id ON 
    prop_supp_assoc.prop_id = agent_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = agent_assoc.owner_tax_yr
WHERE (property_val.prop_val_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc
      WHERE prop_id = property.prop_id))

GO

