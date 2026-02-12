







CREATE VIEW dbo.PTD_AMR_TAXING_UNIT_VW
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, entity.taxing_unit_num, 
    entity.ptd_multi_unit, tax_rate.appraise_for
FROM entity_prop_assoc INNER JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id INNER JOIN
    prop_supp_assoc ON 
    entity_prop_assoc.prop_id = prop_supp_assoc.prop_id AND 
    entity_prop_assoc.tax_yr = prop_supp_assoc.owner_tax_yr AND
     entity_prop_assoc.sup_num = prop_supp_assoc.sup_num INNER
     JOIN
    tax_rate ON entity.entity_id = tax_rate.entity_id AND 
    entity_prop_assoc.tax_yr = tax_rate.tax_rate_yr
WHERE (tax_rate.appraise_for = 'T') AND 
    (tax_rate.appraise_for IS NOT NULL)

GO

