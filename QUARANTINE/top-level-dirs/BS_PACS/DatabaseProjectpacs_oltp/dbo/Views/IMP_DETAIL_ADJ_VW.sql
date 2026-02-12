

CREATE VIEW dbo.IMP_DETAIL_ADJ_VW
AS
SELECT imprv_det_adj.prop_id, 
    imprv_det_adj.prop_val_yr, imprv_det_adj.imprv_id, 
    imprv_det_adj.imprv_det_id, 
    imprv_det_adj.imprv_det_adj_seq, imprv_det_adj.sup_num, 
    imprv_det_adj.sale_id, imprv_det_adj.imprv_adj_type_cd, 
    imprv_det_adj.imprv_det_adj_desc, 
    imprv_det_adj.imprv_det_adj_cd, 
    imprv_det_adj.imprv_det_adj_pc, 
    imprv_det_adj.imprv_det_adj_amt, 
    imprv_adj_type.imprv_adj_type_desc, 
    imprv_adj_type.imprv_adj_type_usage, 
    imprv_adj_type.imprv_adj_type_amt, 
    imprv_adj_type.imprv_adj_type_pct, 
    imprv_det_adj.imprv_det_adj_lid_year_added, 
    imprv_det_adj.imprv_det_adj_lid_orig_value, 
    imprv_det_adj.imprv_det_adj_lid_econ_life, 
    imprv_det_adj.imprv_det_adj_lid_residual_pct
FROM imprv_det_adj LEFT OUTER JOIN
    imprv_adj_type ON 
    imprv_det_adj.prop_val_yr = imprv_adj_type.imprv_adj_type_year
     AND 
    imprv_det_adj.imprv_adj_type_cd = imprv_adj_type.imprv_adj_type_cd

GO

