CREATE TABLE [dbo].[pp_schedule_quality_density] (
    [pp_sched_id]    INT             NOT NULL,
    [pp_sched_qd_id] INT             NOT NULL,
    [year]           NUMERIC (4)     NOT NULL,
    [quality_cd]     CHAR (5)        NULL,
    [density_cd]     CHAR (5)        NULL,
    [qd_unit_price]  NUMERIC (14, 2) NULL,
    [qd_percent]     NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_quality_density] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_qd_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO

