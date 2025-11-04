








CREATE VIEW dbo.PP_SCHED_ADJ_VW
AS
SELECT pp_adj.pp_adj_desc, pp_adj.pp_adj_usage, 
    pp_adj.pp_adj_amt, pp_adj.pp_adj_pct, 
    pp_schedule_adj.pp_sched_id, 
    pp_schedule_adj.pp_sched_adj_id, pp_schedule_adj.year, 
    pp_schedule_adj.pp_sched_adj_cd, 
    pp_schedule_adj.pp_sched_adj_desc, 
    pp_schedule_adj.pp_sched_adj_pc, 
    pp_schedule_adj.pp_sched_adj_amt
FROM pp_adj LEFT OUTER JOIN
    pp_schedule_adj ON 
    pp_adj.pp_adj_cd = pp_schedule_adj.pp_sched_adj_cd

GO

