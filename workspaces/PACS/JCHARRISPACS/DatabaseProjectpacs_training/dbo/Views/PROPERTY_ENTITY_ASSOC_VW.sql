











CREATE VIEW dbo.PROPERTY_ENTITY_ASSOC_VW
AS
SELECT entity_prop_assoc.entity_id AS assoc_entity_id, 
    entity_prop_assoc.prop_id, entity_prop_assoc.sup_num, 
    entity_prop_assoc.tax_yr, 
    entity_prop_assoc.entity_prop_id AS entity_reference_id, 
    entity_prop_assoc.entity_prop_pct, 
    entity.entity_id AS entity_entity_id, entity.entity_cd, 
    entity.entity_type_cd, entity.entity_disb_bal, 
    entity.taxing_unit_num, entity.mbl_hm_submission, 
    entity.freeports_allowed, account.file_as_name
FROM entity_prop_assoc INNER JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id INNER JOIN
    account ON entity.entity_id = account.acct_id

GO

