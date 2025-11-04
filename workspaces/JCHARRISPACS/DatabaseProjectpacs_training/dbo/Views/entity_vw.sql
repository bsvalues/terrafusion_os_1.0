




CREATE VIEW dbo.entity_vw
AS
SELECT entity.*, account.file_as_name AS file_as_name, 
    address.addr_line1 AS Expr1, address.addr_line2 AS Expr2, 
    address.addr_line3 AS Expr3, address.addr_city AS Expr4, 
    address.addr_state AS Expr5, address.country_cd AS Expr6, 
    address.addr_zip AS Expr7, 
    address.addr_type_cd AS Expr8
FROM entity INNER JOIN
    account ON entity.entity_id = account.acct_id INNER JOIN
    address ON account.acct_id = address.acct_id
WHERE (address.primary_addr = 'Y')

GO

