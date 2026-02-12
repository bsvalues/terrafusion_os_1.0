CREATE TABLE [dbo].[pp_schedule_area] (
    [pp_sched_id]      INT             NOT NULL,
    [pp_sched_area_id] INT             NOT NULL,
    [year]             NUMERIC (4)     NOT NULL,
    [area_max]         NUMERIC (14, 1) NOT NULL,
    [area_price]       NUMERIC (14, 2) NULL,
    [area_percent]     NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_area] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_area_id] ASC, [year] ASC, [area_max] ASC) WITH (FILLFACTOR = 100)
);


GO

