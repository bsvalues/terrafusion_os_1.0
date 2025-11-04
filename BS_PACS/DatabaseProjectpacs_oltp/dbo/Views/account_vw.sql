


CREATE VIEW account_vw
AS
SELECT DISTINCT account.acct_id, (select count(distinct owner.prop_id)
					from owner with (nolock), pacs_system with (nolock)
					where owner.owner_id = account.acct_id
					and owner.owner_tax_yr = pacs_system.appr_yr) as num_props,
    account.first_name, account.last_name, account.file_as_name, 
    account.dl_num, account.dl_state, account.dl_expir_dt, 
    account.merged_acct_id, account.acct_create_dt, 
    account.ref_id1, account.opening_balance, 
    address.addr_type_cd, address.primary_addr, 
    address.addr_line1, address.addr_line2, address.addr_line3, 
    address.addr_city, address.addr_state, address.country_cd, 
    address.addr_zip, address.ml_returned_dt, 
    address.ml_type_cd, address.ml_deliverable, 
    address.ml_return_type_cd, address.ml_returned_reason, 
    address.cass_dt, address.delivery_point, 
    address.carrier_route, address.check_digit, 
    address.update_flag, phone.phone_id, phone.phone_type_cd, 
    phone.phone_num, account.confidential_file_as_name, 
    account.confidential_flag, account.confidential_first_name, 
    account.confidential_last_name
FROM account 
WITH (NOLOCK)
LEFT OUTER JOIN address
WITH (NOLOCK)
ON account.acct_id = address.acct_id
LEFT OUTER JOIN phone
WITH (NOLOCK)
ON account.acct_id = phone.acct_id
WHERE (account.acct_id NOT IN
        (SELECT agent_id
      FROM agent WITH (NOLOCK))) AND (account.acct_id NOT IN
        (SELECT attorney_id
      FROM attorney WITH (NOLOCK))) AND (account.acct_id NOT IN
        (SELECT mortgage_co_id
      FROM mortgage_co WITH (NOLOCK))) AND (account.acct_id NOT IN
        (SELECT entity_id
      FROM entity WITH (NOLOCK)))

GO

