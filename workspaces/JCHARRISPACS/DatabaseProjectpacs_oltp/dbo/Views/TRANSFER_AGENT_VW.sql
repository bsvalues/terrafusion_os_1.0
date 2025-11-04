




CREATE VIEW dbo.TRANSFER_AGENT_VW
AS
SELECT address.acct_id AS address_acct_id, 
    phone.acct_id AS phone_acct_id, account.first_name, 
    account.dl_num, account.last_name, account.file_as_name, 
    account.merged_acct_id, account.ref_id1, account.dl_state, 
    account.acct_create_dt, account.dl_expir_dt, 
    account.opening_balance, address.addr_type_cd, 
    address.primary_addr, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, address.addr_zip, 
    address.ml_returned_dt, address.ml_type_cd, 
    address.ml_deliverable, address.ml_return_type_cd, 
    address.ml_returned_reason, address.cass_dt, 
    address.delivery_point, address.carrier_route, 
    address.check_digit, address.update_flag, phone.phone_id, 
    phone.phone_type_cd, phone.phone_num, 
    agent_assoc.owner_tax_yr, agent_assoc.agent_id, 
    agent_assoc.arb_mailings, agent_assoc.prop_id, 
    agent_assoc.ca_mailings, agent_assoc.owner_id, 
    agent_assoc.expired_dt_tm, agent_assoc.ent_mailings, 
    agent_assoc.appl_dt, agent_assoc.eff_dt, 
    agent_assoc.exp_dt
FROM account INNER JOIN
    agent_assoc ON 
    account.acct_id = agent_assoc.agent_id LEFT OUTER JOIN
    address ON account.acct_id = address.acct_id AND 
    address.primary_addr = 'Y' LEFT OUTER JOIN
    phone ON account.acct_id = phone.acct_id

GO

