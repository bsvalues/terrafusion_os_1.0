


CREATE VIEW dbo.PP_SEG_SCHED_ASSOC_VW
AS
SELECT pp_seg_sched_assoc.pp_seg_id, 
    pp_seg_sched_assoc.prop_val_yr, 
    pp_seg_sched_assoc.sup_num, 
    pp_seg_sched_assoc.sale_id, 
    pp_seg_sched_assoc.pp_sched_id, 
    pp_seg_sched_assoc.active_flag, 
    pp_seg_sched_assoc.unit_price, pp_schedule.value_method, 
    pp_schedule.table_code, pp_schedule.segment_type, 
    pp_table_meth.pp_table_meth_desc AS value_method_desc, 
    pp_type.pp_type_desc AS segment_type_desc, 
    sic_code.sic_desc AS table_code_desc, 
    pp_seg_sched_assoc.flat_price_flag, 
    pp_seg_sched_assoc.value_method AS ppssa_value_method, 
    pp_seg_sched_assoc.table_code AS ppssa_table_code, 
    pp_seg_sched_assoc.segment_type AS ppssa_segment_type, 
    pp_seg_sched_assoc.prop_id
FROM pp_seg_sched_assoc LEFT OUTER JOIN
    pp_schedule ON 
    pp_seg_sched_assoc.prop_val_yr = pp_schedule.year AND 
    pp_seg_sched_assoc.pp_sched_id = pp_schedule.pp_sched_id
     LEFT OUTER JOIN
    pp_type ON 
    pp_schedule.segment_type = pp_type.pp_type_cd LEFT OUTER JOIN
    sic_code ON 
    pp_schedule.table_code = sic_code.sic_cd LEFT OUTER JOIN
    pp_table_meth ON 
    pp_schedule.value_method = pp_table_meth.pp_table_meth_cd

GO

