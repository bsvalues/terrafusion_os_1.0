








CREATE VIEW dbo.account_prop_count_vw
AS
SELECT account.acct_id, COUNT(owner.prop_id) AS num_props, 
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
    phone.phone_num
FROM property INNER JOIN
    owner ON 
    property.prop_id = owner.prop_id RIGHT OUTER JOIN
    account LEFT OUTER JOIN
    address ON 
    account.acct_id = address.acct_id LEFT OUTER JOIN
    phone ON account.acct_id = phone.acct_id ON 
    owner.owner_id = account.acct_id
WHERE (account.acct_id NOT IN
        (SELECT agent_id
      FROM agent)) AND (account.acct_id NOT IN
        (SELECT attorney_id
      FROM attorney)) AND (account.acct_id NOT IN
        (SELECT mortgage_co_id
      FROM mortgage_co)) AND (account.acct_id NOT IN
        (SELECT entity_id
      FROM entity))
GROUP BY account.acct_id, account.first_name, account.last_name, 
    account.file_as_name, account.dl_num, account.dl_state, 
    account.dl_expir_dt, account.merged_acct_id, 
    account.acct_create_dt, account.ref_id1, 
    account.opening_balance, address.addr_type_cd, 
    address.primary_addr, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, address.addr_zip, 
    address.ml_returned_dt, address.ml_type_cd, 
    address.ml_deliverable, address.ml_return_type_cd, 
    address.ml_returned_reason, address.cass_dt, 
    address.delivery_point, address.carrier_route, 
    address.check_digit, address.update_flag, phone.phone_id, 
    phone.phone_type_cd, phone.phone_num

GO

