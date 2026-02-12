


CREATE VIEW dbo.transfer_appraisal_info_imprv_vw
AS
SELECT     dbo.imprv.prop_id, dbo.imprv.prop_val_yr, dbo.imprv.imprv_id,
                      ISNULL(dbo.imprv.imprv_type_cd, '') AS imprv_type_cd,
                      ISNULL(dbo.imprv_type.imprv_type_desc, '') AS imprv_type_desc, ISNULL(dbo.imprv.imprv_state_cd, '') AS imprv_state_cd, 
                      ISNULL(dbo.imprv.imprv_homesite, '') AS imprv_homesite, ISNULL(dbo.imprv.imprv_val, 0) AS imprv_val
FROM         dbo.imprv INNER JOIN
                      dbo.transfer_appraisal_info_supp_assoc ON dbo.imprv.prop_id = dbo.transfer_appraisal_info_supp_assoc.prop_id AND 
                      dbo.imprv.sup_num = dbo.transfer_appraisal_info_supp_assoc.sup_num AND 
                      dbo.imprv.prop_val_yr = dbo.transfer_appraisal_info_supp_assoc.owner_tax_yr LEFT OUTER JOIN
                      dbo.imprv_type ON dbo.imprv.imprv_type_cd = dbo.imprv_type.imprv_type_cd
WHERE     (dbo.imprv.sale_id = 0)

GO

