
CREATE VIEW dbo.entity_exempt_ov65_vw
AS
SELECT entity_exmpt.entity_id, 
    entity_exmpt.exmpt_type_cd, 
    entity_exmpt.exmpt_tax_yr, 
    entity_exmpt.entity_exmpt_desc, 
    entity_exmpt.special_exmpt, 
    entity_exmpt.local_option_pct, 
    entity_exmpt.state_mandate_amt, 
    entity_exmpt.local_option_min_amt, 
    entity_exmpt.local_option_amt, 
    entity_exmpt.apply_pct_ownrship, 
    exmpt_type.exmpt_desc, exmpt_type.federal_amt, 
    exmpt_type.plus_oa65_amt, 
    exmpt_type.spl_exmpt
FROM entity_exmpt INNER JOIN
    exmpt_type ON 
    entity_exmpt.exmpt_type_cd = exmpt_type.exmpt_type_cd
WHERE (entity_exmpt.exmpt_type_cd = 'OV65')

GO

