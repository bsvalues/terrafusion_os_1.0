




CREATE VIEW dbo.transfer_grayson_stmnt_entity_exmpt_fp_vw
AS
SELECT prop_id, owner_id, sup_num, exmpt_tax_yr, entity_id, 
    SUM(state_amt + local_amt) AS exmpt_amt
FROM property_entity_exemption
WHERE exmpt_type_cd = 'FP'
GROUP BY prop_id, owner_id, sup_num, exmpt_tax_yr, entity_id

GO

