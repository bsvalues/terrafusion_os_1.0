

CREATE VIEW dbo.IMP_ADJ_VW
AS
SELECT imprv_adj.prop_id, 
    imprv_adj.prop_val_yr, imprv_adj.imprv_id, 
    imprv_adj.imprv_adj_seq, imprv_adj.sup_num, 
    imprv_adj.sale_id, imprv_adj.imprv_adj_desc, 
    imprv_adj.imprv_adj_type_cd, imprv_adj.imprv_adj_pc, 
    imprv_adj.imprv_adj_amt, 
    imprv_adj_type.imprv_adj_type_desc, 
    imprv_adj_type.imprv_adj_type_usage, 
    imprv_adj_type.imprv_adj_type_amt, 
    imprv_adj_type.imprv_adj_type_pct
FROM imprv_adj LEFT OUTER JOIN
    imprv_adj_type ON 
    imprv_adj.prop_val_yr = imprv_adj_type.imprv_adj_type_year AND
     imprv_adj.imprv_adj_type_cd = imprv_adj_type.imprv_adj_type_cd

GO

