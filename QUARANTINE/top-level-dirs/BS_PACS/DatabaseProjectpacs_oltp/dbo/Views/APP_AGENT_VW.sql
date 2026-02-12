


CREATE VIEW dbo.APP_AGENT_VW
AS
SELECT agent_assoc.owner_tax_yr, agent_assoc.agent_id, 
    agent_assoc.arb_mailings, agent_assoc.prop_id, 
    agent_assoc.ca_mailings, agent_assoc.owner_id, 
    agent_assoc.expired_dt_tm, agent_assoc.ent_mailings, 
    agent_assoc.appl_dt, agent_assoc.eff_dt, agent_assoc.exp_dt, 
    agent_assoc.agent_cmnt, agent_assoc.purge_dt, 
    agent_assoc.auth_to_protest, agent_assoc.auth_to_resolve, 
    agent_assoc.auth_confidential, agent_assoc.auth_other, 
    address.addr_type_cd, address.primary_addr, 
    address.addr_line1, address.addr_line2, address.addr_city, 
    address.addr_line3, address.addr_state, address.country_cd, 
    address.addr_zip, phone.phone_num, phone.phone_type_cd, 
    account.file_as_name, account.confidential_file_as_name,
    address.zip_4_2,
	address.cass,
	cast(isnull(address.is_international, 0) as bit) as is_international
FROM agent_assoc LEFT OUTER JOIN
    account ON 
    agent_assoc.agent_id = account.acct_id LEFT OUTER JOIN
    address ON agent_assoc.agent_id = address.acct_id AND 
    address.primary_addr = 'Y' LEFT OUTER JOIN
    phone ON agent_assoc.agent_id = phone.acct_id AND 
    phone.phone_type_cd = 'B'
WHERE (agent_assoc.exp_dt IS NULL) OR
    (agent_assoc.exp_dt > GETDATE())

GO

