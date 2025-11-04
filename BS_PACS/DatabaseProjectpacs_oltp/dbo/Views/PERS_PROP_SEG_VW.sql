

CREATE VIEW dbo.PERS_PROP_SEG_VW
AS
SELECT pers_prop_seg.prop_id, 
    pers_prop_seg.prop_val_yr, pers_prop_seg.sup_num, 
    pers_prop_seg.pp_seg_id, pers_prop_seg.sale_id, 
    pers_prop_seg.pp_table_meth_cd, 
    pp_table_meth.pp_table_meth_desc, 
    pers_prop_seg.pp_type_cd, pp_type.pp_type_desc, 
    pers_prop_seg.pp_appraise_meth, 
    pers_prop_seg.pp_mkt_val, pers_prop_seg.pp_sic_cd, 
    sic_code.sic_desc, pers_prop_seg.pp_active_flag, 
    pers_prop_seg.pp_description, 
    pers_prop_seg.pp_comment
FROM pers_prop_seg LEFT OUTER JOIN
    pp_table_meth ON 
    pers_prop_seg.pp_table_meth_cd = pp_table_meth.pp_table_meth_cd
     LEFT OUTER JOIN
    pp_type ON 
    pers_prop_seg.pp_type_cd = pp_type.pp_type_cd LEFT OUTER JOIN
    sic_code ON pers_prop_seg.pp_sic_cd = sic_code.sic_cd

GO

