

CREATE VIEW dbo.farmland_vw
AS
SELECT account.file_as_name, property_val.prop_id, 
    property_val.legal_desc, entity.entity_type_cd
FROM property_val INNER JOIN
    land_detail ON 
    property_val.prop_id = land_detail.prop_id AND 
    property_val.prop_val_yr = land_detail.prop_val_yr AND 
    property_val.sup_num = land_detail.sup_num INNER JOIN
    owner ON property_val.prop_id = owner.prop_id AND 
    property_val.prop_val_yr = owner.owner_tax_yr AND 
    property_val.sup_num = owner.sup_num INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num INNER JOIN
    account ON owner.owner_id = account.acct_id INNER JOIN
    pacs_year ON 
    entity_prop_assoc.tax_yr = pacs_year.tax_yr INNER JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id
WHERE (entity.entity_type_cd LIKE 'G% ')

GO

