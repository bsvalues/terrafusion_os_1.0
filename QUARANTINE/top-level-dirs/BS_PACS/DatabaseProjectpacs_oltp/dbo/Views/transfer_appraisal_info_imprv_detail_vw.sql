


CREATE VIEW dbo.transfer_appraisal_info_imprv_detail_vw
AS
SELECT     dbo.imprv_detail.prop_id, dbo.imprv_detail.prop_val_yr, 
                      dbo.imprv_detail.imprv_id, dbo.imprv_detail.imprv_det_id,
                      ISNULL(dbo.imprv_detail.imprv_det_type_cd, '') AS imprv_det_type_cd, ISNULL(dbo.imprv_det_type.imprv_det_typ_desc, '') 
                      AS imprv_det_type_desc, ISNULL(dbo.imprv_detail.imprv_det_class_cd, '') AS imprv_det_class_cd, 
                      ISNULL(dbo.imprv_detail.yr_built, 0) AS yr_built, ISNULL(dbo.imprv_detail.depreciation_yr, 0) AS depreciation_yr, 
                      ISNULL(dbo.imprv_detail.imprv_det_area, 0) AS imprv_det_area, ISNULL(dbo.imprv_detail.imprv_det_val, 0) 
                      AS imprv_det_val, ISNULL(dbo.imprv_detail.sketch_cmds, '') AS sketch_cmds
FROM         dbo.imprv_detail INNER JOIN
                      dbo.transfer_appraisal_info_supp_assoc ON dbo.imprv_detail.prop_id = dbo.transfer_appraisal_info_supp_assoc.prop_id AND 
                      dbo.imprv_detail.sup_num = dbo.transfer_appraisal_info_supp_assoc.sup_num AND 
                      dbo.imprv_detail.prop_val_yr = dbo.transfer_appraisal_info_supp_assoc.owner_tax_yr LEFT OUTER JOIN
                      dbo.imprv_det_type ON dbo.imprv_detail.imprv_det_type_cd = dbo.imprv_det_type.imprv_det_type_cd
WHERE     (dbo.imprv_detail.sale_id = 0)

GO

