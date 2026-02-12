


CREATE VIEW dbo.TaxservInfoVw
AS
SELECT taxserver.taxserver_id, taxserver.taxserver_cd, 
    account.file_as_name, account.first_name, account.last_name, 
    phone.phone_num, address.addr_line1, address.addr_city, 
    address.addr_state, address.addr_zip
FROM taxserver INNER JOIN
    account ON 
    taxserver.taxserver_id = account.acct_id LEFT OUTER JOIN
    address ON 
    account.acct_id = address.acct_id LEFT OUTER JOIN
    phone ON account.acct_id = phone.acct_id

GO

