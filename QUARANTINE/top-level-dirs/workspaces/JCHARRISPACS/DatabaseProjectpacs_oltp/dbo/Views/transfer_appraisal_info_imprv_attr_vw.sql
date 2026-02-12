



CREATE VIEW dbo.transfer_appraisal_info_imprv_attr_vw
AS
SELECT     CONVERT(char(12), dbo.imprv_attr.prop_id) AS prop_id, CONVERT(char(4), dbo.imprv_attr.prop_val_yr) AS prop_val_yr, CONVERT(char(12), 
                      dbo.imprv_attr.imprv_id) AS imprv_id, CONVERT(char(12), dbo.imprv_attr.imprv_det_id) AS imprv_det_id, CONVERT(char(12), dbo.imprv_attr.imprv_attr_id) 
                      AS imprv_attr_id, CONVERT(char(25), ISNULL(dbo.attribute.imprv_attr_desc, '')) AS imprv_attr_desc, CONVERT(char(10), 
                      ISNULL(dbo.imprv_attr.i_attr_val_cd, '')) AS imprv_attr_cd
FROM         dbo.imprv_attr INNER JOIN
                      dbo.transfer_appraisal_info_supp_assoc ON dbo.imprv_attr.prop_id = dbo.transfer_appraisal_info_supp_assoc.prop_id AND 
                      dbo.imprv_attr.sup_num = dbo.transfer_appraisal_info_supp_assoc.sup_num AND 
                      dbo.imprv_attr.prop_val_yr = dbo.transfer_appraisal_info_supp_assoc.owner_tax_yr LEFT OUTER JOIN
                      dbo.attribute ON dbo.imprv_attr.i_attr_val_id = dbo.attribute.imprv_attr_id
WHERE     (dbo.imprv_attr.sale_id = 0)

GO

