


CREATE VIEW dbo.entity_owner_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, prop_supp_assoc.sup_num, 
    entity.entity_cd, account.file_as_name, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, 
    address.addr_zip
FROM prop_supp_assoc INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id INNER JOIN
    owner ON 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.sup_num = owner.sup_num INNER JOIN
    account INNER JOIN
    address ON account.acct_id = address.acct_id ON 
    owner.owner_id = account.acct_id AND 
    address.primary_addr = 'Y'

GO

