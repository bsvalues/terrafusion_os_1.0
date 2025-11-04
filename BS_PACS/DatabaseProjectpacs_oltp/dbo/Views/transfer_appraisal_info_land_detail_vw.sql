



CREATE VIEW dbo.transfer_appraisal_info_land_detail_vw
AS
SELECT     dbo.land_detail.prop_id, dbo.land_detail.prop_val_yr AS prop_val_yr, 
                      dbo.land_detail.land_seg_id, ISNULL(dbo.land_detail.land_type_cd, '') AS land_type_cd, 
                      ISNULL(dbo.land_type.land_type_desc, '') AS land_type_desc, ISNULL(dbo.land_detail.state_cd, '') AS state_cd, 
                      ISNULL(dbo.land_detail.land_seg_homesite, '') AS land_seg_homesite, ISNULL(dbo.land_detail.size_acres, 0) AS size_acres, 
                      ISNULL(dbo.land_detail.size_square_feet, 0) AS size_square_feet, ISNULL(dbo.land_detail.effective_front, 0) 
                      AS effective_front, ISNULL(dbo.land_detail.effective_depth, 0) AS effective_depth, 
                      ISNULL(land_sched1.ls_method, '') AS mkt_ls_method, ISNULL(land_sched1.ls_code, '') AS mkt_ls_class, 
                      ISNULL(dbo.land_detail.land_seg_mkt_val, 0) AS land_seg_mkt_val, ISNULL(dbo.land_detail.ag_apply, '') AS ag_apply, 
                      ISNULL(land_sched1.ls_method, '') AS ag_ls_method, ISNULL(land_sched1.ls_code, '') AS ag_ls_class, 
                      ISNULL(dbo.land_detail.ag_val, 0) AS ag_val
FROM         dbo.land_detail INNER JOIN
                      dbo.transfer_appraisal_info_supp_assoc ON dbo.land_detail.prop_id = dbo.transfer_appraisal_info_supp_assoc.prop_id AND 
                      dbo.land_detail.sup_num = dbo.transfer_appraisal_info_supp_assoc.sup_num AND 
                      dbo.land_detail.prop_val_yr = dbo.transfer_appraisal_info_supp_assoc.owner_tax_yr LEFT OUTER JOIN
                      dbo.land_type ON dbo.land_detail.land_type_cd = dbo.land_type.land_type_cd LEFT OUTER JOIN
                      dbo.land_sched land_sched1 ON dbo.land_detail.prop_val_yr = land_sched1.ls_year AND 
                      dbo.land_detail.ls_mkt_id = land_sched1.ls_id LEFT OUTER JOIN
                      dbo.land_sched land_sched_1 ON dbo.land_detail.ls_ag_id = land_sched1.ls_id AND dbo.land_detail.prop_val_yr = land_sched1.ls_year
WHERE     (dbo.land_detail.sale_id = 0)

GO

