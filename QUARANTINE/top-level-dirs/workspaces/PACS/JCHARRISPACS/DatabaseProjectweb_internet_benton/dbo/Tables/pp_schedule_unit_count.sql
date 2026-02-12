CREATE TABLE [dbo].[pp_schedule_unit_count] (
    [pp_sched_id]            INT             NOT NULL,
    [pp_sched_unit_count_id] INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [unit_count_max]         NUMERIC (16, 4) NOT NULL,
    [unit_price]             NUMERIC (14, 2) NULL,
    [unit_percent]           NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_unit_count] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_unit_count_id] ASC, [year] ASC, [unit_count_max] ASC) WITH (FILLFACTOR = 100)
);


GO

