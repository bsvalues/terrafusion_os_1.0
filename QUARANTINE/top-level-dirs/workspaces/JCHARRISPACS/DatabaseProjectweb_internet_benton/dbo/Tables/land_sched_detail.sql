CREATE TABLE [dbo].[land_sched_detail] (
    [ls_detail_id]             INT             NOT NULL,
    [ls_id]                    INT             NOT NULL,
    [ls_year]                  NUMERIC (4)     NOT NULL,
    [ls_range_max]             NUMERIC (18, 4) NOT NULL,
    [ls_range_price]           NUMERIC (14, 2) NOT NULL,
    [ls_range_pc]              NUMERIC (5, 2)  NULL,
    [ls_range_adj_price]       NUMERIC (14, 2) NULL,
    [ls_range_interpolate_inc] NUMERIC (14, 6) NULL,
    [land_price_type]          VARCHAR (5)     NOT NULL,
    CONSTRAINT [CPK_land_sched_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [ls_detail_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_ls_id]
    ON [dbo].[land_sched_detail]([ls_id] ASC) WITH (FILLFACTOR = 90);


GO

