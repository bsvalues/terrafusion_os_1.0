CREATE TABLE [dbo].[pp_schedule_class] (
    [pp_sched_id]       INT             NOT NULL,
    [pp_sched_class_id] INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [pp_class_cd]       CHAR (5)        NOT NULL,
    [pp_class_amt]      NUMERIC (14, 2) NULL,
    [pp_class_pct]      NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_class] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_class_id] ASC, [year] ASC, [pp_class_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

