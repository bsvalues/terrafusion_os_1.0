




CREATE VIEW dbo.transfer_grayson_stmnt_entity_exmpt_hs_vw
AS
SELECT prop_id, owner_id, sup_num, exmpt_tax_yr, entity_id, 
    SUM(state_amt + local_amt) AS exmpt_amt
FROM property_entity_exemption
WHERE exmpt_type_cd = 'HS'
or    exmpt_type_cd = 'OV65'
or    exmpt_type_cd = 'OV65S'
or    exmpt_type_cd = 'DP'
GROUP BY prop_id, owner_id, sup_num, exmpt_tax_yr, entity_id

GO

