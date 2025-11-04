








CREATE VIEW dbo.PP_SCHED_CLASS_VW
AS
SELECT pp_schedule_class.pp_sched_id, 
    pp_schedule_class.pp_sched_class_id, 
    pp_schedule_class.year, pp_schedule_class.pp_class_cd, 
    pp_schedule_class.pp_class_amt, 
    pp_schedule_class.pp_class_pct, 
    pp_class.pp_class_desc
FROM pp_class RIGHT OUTER JOIN
    pp_schedule_class ON 
    pp_class.pp_class_cd = pp_schedule_class.pp_class_cd

GO

