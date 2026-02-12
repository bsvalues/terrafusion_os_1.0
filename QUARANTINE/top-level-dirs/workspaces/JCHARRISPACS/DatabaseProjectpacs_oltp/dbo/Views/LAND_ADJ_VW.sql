

CREATE VIEW dbo.LAND_ADJ_VW
AS
SELECT la.prop_id, la.prop_val_yr, la.sup_num, 
    la.sale_id, la.land_seg_id, la.land_seg_adj_seq, 
    la.land_value, la.land_seg_adj_dt, la.land_seg_adj_type, 
    la.land_seg_adj_desc, la.land_seg_adj_cd, 
    la.land_seg_adj_pc, land_adj_type.land_adj_type_cd, 
    land_adj_type.land_adj_type_desc, 
    land_adj_type.land_adj_type_usage, 
    land_adj_type.land_adj_type_amt, 
    land_adj_type.land_adj_type_pct
FROM land_adj la LEFT OUTER JOIN
    land_adj_type ON 
    la.land_seg_adj_type = land_adj_type.land_adj_type_cd AND 
    la.prop_val_yr = land_adj_type.land_adj_type_year

GO

