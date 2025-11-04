
CREATE VIEW dbo.prop_w_hs_vw
AS
SELECT prop_id, owner_id, exmpt_tax_yr, owner_tax_yr, 
    exmpt_type_cd, sup_num
FROM property_exemption
WHERE (exmpt_type_cd = 'HS')

GO

