












CREATE VIEW dbo.web_owner_vw
AS
SELECT account.first_name, account.last_name, 
    account.file_as_name, address.primary_addr, 
    address.addr_type_cd, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, address.addr_zip, 
    prop_supp_assoc.prop_id, prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num, owner.owner_id, owner.pct_ownership
FROM owner INNER JOIN
    account ON 
    owner.owner_id = account.acct_id LEFT OUTER JOIN
    address ON 
    account.acct_id = address.acct_id LEFT OUTER JOIN
    prop_supp_assoc ON 
    owner.prop_id = prop_supp_assoc.prop_id AND 
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr AND 
    owner.sup_num = prop_supp_assoc.sup_num
WHERE (address.primary_addr = 'Y') AND 
    (address.addr_type_cd = 'M')

GO

