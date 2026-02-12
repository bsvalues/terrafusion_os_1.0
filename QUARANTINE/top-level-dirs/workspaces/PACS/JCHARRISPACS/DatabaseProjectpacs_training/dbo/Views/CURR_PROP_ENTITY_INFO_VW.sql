












CREATE VIEW dbo.CURR_PROP_ENTITY_INFO_VW
AS
SELECT prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num, entity_prop_assoc.entity_prop_id, 
    entity_prop_assoc.entity_prop_pct, 
    entity_prop_assoc.entity_id, entity.entity_cd, 
    prop_supp_assoc.prop_id, account.file_as_name
FROM entity_prop_assoc INNER JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id INNER JOIN
    prop_supp_assoc ON 
    entity_prop_assoc.prop_id = prop_supp_assoc.prop_id AND 
    entity_prop_assoc.sup_num = prop_supp_assoc.sup_num AND 
    entity_prop_assoc.tax_yr = prop_supp_assoc.owner_tax_yr INNER
     JOIN
    account ON entity.entity_id = account.acct_id
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa
      WHERE psa.prop_id = entity_prop_assoc.prop_id))

GO

