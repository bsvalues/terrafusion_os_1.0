

CREATE VIEW dbo.mh_movement_info_vw
AS
SELECT     dbo.imprv.prop_id, dbo.imprv.prop_val_yr, dbo.imprv.sup_num, dbo.imprv.sale_id, dbo.imprv.effective_yr_blt, dbo.imprv.mbl_hm_make, 
                      dbo.imprv.mbl_hm_model, dbo.imprv.mbl_hm_sn, dbo.imprv.mbl_hm_hud_num, dbo.imprv.mbl_hm_title_num, dbo.imprv_detail.length, 
                      dbo.imprv_detail.width
FROM         dbo.prop_supp_assoc INNER JOIN
                      dbo.imprv ON dbo.prop_supp_assoc.prop_id = dbo.imprv.prop_id AND dbo.prop_supp_assoc.owner_tax_yr = dbo.imprv.prop_val_yr AND 
                      dbo.prop_supp_assoc.sup_num = dbo.imprv.sup_num LEFT OUTER JOIN
                      dbo.imprv_detail ON dbo.imprv.prop_id = dbo.imprv_detail.prop_id AND 
                      dbo.imprv.prop_val_yr = dbo.imprv_detail.prop_val_yr AND dbo.imprv.imprv_id = dbo.imprv_detail.imprv_id AND 
                      dbo.imprv.sup_num = dbo.imprv_detail.sup_num AND dbo.imprv.sale_id = dbo.imprv_detail.sale_id AND
		      ((dbo.imprv_detail.length IS NOT NULL) OR (dbo.imprv_detail.width IS NOT NULL))
WHERE     (dbo.imprv.mbl_hm_make IS NOT NULL) OR
                      (dbo.imprv.mbl_hm_model IS NOT NULL) OR
                      (dbo.imprv.mbl_hm_sn IS NOT NULL) OR
                      (dbo.imprv.mbl_hm_hud_num IS NOT NULL) OR
                      (dbo.imprv.mbl_hm_title_num IS NOT NULL)

GO

