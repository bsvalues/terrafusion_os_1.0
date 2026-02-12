CREATE TABLE [dbo].[pp_schedule_adj] (
    [pp_sched_id]       INT            NOT NULL,
    [pp_sched_adj_id]   INT            NOT NULL,
    [year]              NUMERIC (4)    NOT NULL,
    [pp_sched_adj_cd]   CHAR (5)       NULL,
    [pp_sched_adj_desc] VARCHAR (50)   NULL,
    [pp_sched_adj_pc]   NUMERIC (5, 2) NULL,
    [pp_sched_adj_amt]  NUMERIC (14)   NULL,
    [sys_flag]          CHAR (1)       NULL,
    CONSTRAINT [CPK_pp_schedule_adj] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_adj_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO

