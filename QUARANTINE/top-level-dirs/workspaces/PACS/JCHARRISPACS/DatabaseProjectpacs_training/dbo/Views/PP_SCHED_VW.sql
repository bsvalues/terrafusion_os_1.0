







CREATE VIEW dbo.PP_SCHED_VW
AS
SELECT pp_schedule.pp_sched_id, pp_schedule.year, 
    pp_schedule.value_method, pp_schedule.table_code, 
    pp_schedule.segment_type, 
    pp_table_meth.pp_table_meth_desc AS value_method_desc, 
    pp_type.pp_type_desc AS table_code_desc, 
    sic_code.sic_desc AS segment_type_desc
FROM pp_schedule LEFT OUTER JOIN
    sic_code ON 
    pp_schedule.table_code = sic_code.sic_cd LEFT OUTER JOIN
    pp_type ON 
    pp_schedule.segment_type = pp_type.pp_type_cd LEFT OUTER JOIN
    pp_table_meth ON 
    pp_schedule.value_method = pp_table_meth.pp_table_meth_cd

GO

