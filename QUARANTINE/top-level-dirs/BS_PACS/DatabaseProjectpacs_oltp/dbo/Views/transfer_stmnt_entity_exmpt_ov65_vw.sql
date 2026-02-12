







CREATE VIEW dbo.transfer_stmnt_entity_exmpt_ov65_vw
AS
SELECT property_entity_exemption.prop_id, col_owner_id as owner_id, sup_num, exmpt_tax_yr, entity_id, 
    SUM(state_amt + local_amt) AS exmpt_amt
FROM property_entity_exemption
inner join property as p on
		property_entity_exemption.prop_id=p.prop_id
WHERE exmpt_type_cd = 'OV65'
or    exmpt_type_cd = 'OV65S'
or    exmpt_type_cd = 'DP'
GROUP BY property_entity_exemption.prop_id, col_owner_id, sup_num, exmpt_tax_yr, entity_id

GO

