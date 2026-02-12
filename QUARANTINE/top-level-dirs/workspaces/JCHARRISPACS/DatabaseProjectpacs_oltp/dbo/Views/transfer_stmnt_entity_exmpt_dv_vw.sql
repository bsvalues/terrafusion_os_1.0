







CREATE VIEW dbo.transfer_stmnt_entity_exmpt_dv_vw
AS
SELECT property_entity_exemption.prop_id, col_owner_id as owner_id, sup_num, exmpt_tax_yr, entity_id, 
    SUM(state_amt + local_amt) AS exmpt_amt
FROM property_entity_exemption
inner join property as p on
property_entity_exemption.prop_id=p.prop_id
WHERE exmpt_type_cd = 'DV1'
or    exmpt_type_cd = 'DV1S'
or    exmpt_type_cd = 'DV2'
or    exmpt_type_cd = 'DV2S'
or    exmpt_type_cd = 'DV3'
or    exmpt_type_cd = 'DV3S'
or    exmpt_type_cd = 'DV4'
or    exmpt_type_cd = 'DV4S'
GROUP BY property_entity_exemption.prop_id, col_owner_id, sup_num, exmpt_tax_yr, entity_id

GO

