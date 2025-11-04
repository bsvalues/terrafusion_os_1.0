


CREATE VIEW dbo.QUICK_POST_TAX_CERT_PROP_ENTITY_VW
AS
SELECT entity_prop_assoc.entity_id, prop_supp_assoc.prop_id, 
    entity.entity_cd, account.file_as_name
FROM entity_prop_assoc INNER JOIN
    prop_supp_assoc ON 
    entity_prop_assoc.prop_id = prop_supp_assoc.prop_id AND 
    entity_prop_assoc.tax_yr = prop_supp_assoc.owner_tax_yr AND
     entity_prop_assoc.sup_num = prop_supp_assoc.sup_num INNER
     JOIN
    tax_rate ON 
    entity_prop_assoc.entity_id = tax_rate.entity_id AND 
    entity_prop_assoc.tax_yr = tax_rate.tax_rate_yr INNER JOIN
    entity ON tax_rate.entity_id = entity.entity_id INNER JOIN
    account ON entity.entity_id = account.acct_id
WHERE (tax_rate.collect_option = 'CT') AND 
    (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa, pacs_system
      WHERE psa.prop_id = entity_prop_assoc.prop_id AND 
           owner_tax_yr <= pacs_system.tax_yr))

GO

