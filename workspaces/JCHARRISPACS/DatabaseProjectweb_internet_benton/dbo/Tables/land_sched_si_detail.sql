CREATE TABLE [dbo].[land_sched_si_detail] (
    [ls_detail_id]   INT             NOT NULL,
    [ls_id]          INT             NOT NULL,
    [ls_year]        NUMERIC (4)     NOT NULL,
    [ls_range_max]   NUMERIC (18, 4) NOT NULL,
    [ls_slope]       NUMERIC (18, 4) NOT NULL,
    [ls_y_intercept] NUMERIC (18, 4) NOT NULL,
    CONSTRAINT [CPK_land_sched_si_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [ls_detail_id] ASC) WITH (FILLFACTOR = 90)
);


GO

