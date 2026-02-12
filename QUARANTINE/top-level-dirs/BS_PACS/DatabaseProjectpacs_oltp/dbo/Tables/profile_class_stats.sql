CREATE TABLE [dbo].[profile_class_stats] (
    [run_id]        INT          NOT NULL,
    [detail_id]     INT          NOT NULL,
    [class_cd]      VARCHAR (10) NOT NULL,
    [num_props]     INT          NULL,
    [max_mkt_value] NUMERIC (14) NULL,
    [mid_mkt_value] NUMERIC (14) NULL,
    [min_mkt_value] NUMERIC (14) NULL,
    [avg_mkt_value] NUMERIC (14) NULL,
    CONSTRAINT [CPK_profile_class_stats] PRIMARY KEY CLUSTERED ([run_id] ASC, [detail_id] ASC, [class_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

