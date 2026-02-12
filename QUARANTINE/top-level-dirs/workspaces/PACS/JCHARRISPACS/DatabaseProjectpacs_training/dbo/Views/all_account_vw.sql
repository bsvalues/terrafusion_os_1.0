











CREATE VIEW dbo.all_account_vw
AS
SELECT account.acct_id, account.first_name, account.last_name, 
    account.file_as_name, account.comment, account.misc_code, 
    account.ref_id1, address.addr_type_cd, address.primary_addr, 
    address.addr_line1, address.addr_line2, address.addr_line3, 
    address.addr_city, address.addr_state, address.country_cd, 
    address.addr_zip, address.ml_returned_dt, 
    address.ml_type_cd, address.ml_deliverable, 
    address.ml_return_type_cd, address.ml_returned_reason, 
    address.cass_dt, address.delivery_point, 
    address.carrier_route, address.check_digit, 
    address.update_flag, address.chg_reason_cd, 
    phone.phone_num, phone.phone_type_cd
FROM account LEFT OUTER JOIN
    phone ON account.acct_id = phone.acct_id LEFT OUTER JOIN
    address ON account.acct_id = address.acct_id
WHERE (address.primary_addr = 'Y')

GO

