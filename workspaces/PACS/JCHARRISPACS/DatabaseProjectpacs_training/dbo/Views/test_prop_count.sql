




CREATE VIEW dbo.test_prop_count
AS
SELECT COUNT(*) AS prop_count
FROM prop_owner_entity_val prop_owner_entity_val INNER JOIN
    tax_rate tax_rate ON 
    prop_owner_entity_val.entity_id = tax_rate.entity_id AND 
    prop_owner_entity_val.sup_yr = tax_rate.tax_rate_yr INNER JOIN
    owner owner ON 
    prop_owner_entity_val.owner_id = owner.owner_id AND 
    prop_owner_entity_val.sup_yr = owner.owner_tax_yr AND 
    prop_owner_entity_val.prop_id = owner.prop_id AND 
    prop_owner_entity_val.sup_num = owner.sup_num INNER JOIN
    bill bill ON 
    prop_owner_entity_val.sup_yr = bill.sup_tax_yr AND 
    prop_owner_entity_val.sup_num = bill.sup_num AND 
    prop_owner_entity_val.entity_id = bill.entity_id AND 
    prop_owner_entity_val.prop_id = bill.prop_id AND 
    prop_owner_entity_val.owner_id = bill.owner_id LEFT OUTER JOIN
    situs situs ON 
    prop_owner_entity_val.prop_id = situs.prop_id AND 
    situs.primary_situs IS NOT NULL AND 
    situs.primary_situs = 'Y' INNER JOIN
    address address ON owner.owner_id = address.acct_id AND 
    address.primary_addr = 'Y' AND 
    address.primary_addr IS NOT NULL INNER JOIN
    property_val property_val ON 
    owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num INNER JOIN
    account account ON 
    owner.owner_id = account.acct_id INNER JOIN
    property property ON 
    property_val.prop_id = property.prop_id
WHERE (prop_owner_entity_val.sup_yr = 1999)

GO

