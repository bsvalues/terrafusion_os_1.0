




CREATE VIEW dbo.web_entity_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, prop_supp_assoc.sup_num, 
    entity.entity_cd, account.file_as_name AS entity_desc, 
    entity_prop_assoc.entity_id, web_tax_rate_vw.tax_rate,
    web_tax_rate_vw.appraise_for
FROM prop_supp_assoc INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id LEFT OUTER JOIN
    account ON 
    entity.entity_id = account.acct_id LEFT OUTER JOIN
    web_tax_rate_vw ON 
    entity_prop_assoc.entity_id = web_tax_rate_vw.entity_id AND 
    entity_prop_assoc.tax_yr = web_tax_rate_vw.tax_rate_yr
WHERE (entity.entity_cd <> 'CAD')

GO

