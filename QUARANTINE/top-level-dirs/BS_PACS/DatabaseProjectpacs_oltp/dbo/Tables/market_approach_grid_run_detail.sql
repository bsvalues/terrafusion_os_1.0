CREATE TABLE [dbo].[market_approach_grid_run_detail] (
    [run_id]                      INT         NOT NULL,
    [detail_id]                   INT         IDENTITY (1, 1) NOT NULL,
    [year]                        NUMERIC (4) NOT NULL,
    [sup_num]                     INT         NOT NULL,
    [prop_id]                     INT         NOT NULL,
    [lPropGridID]                 INT         NULL,
    [failure_reason_min_comps]    BIT         CONSTRAINT [CDF_market_approach_grid_run_detail_failure_reason_min_comps] DEFAULT ((0)) NOT NULL,
    [failure_reason_score]        BIT         CONSTRAINT [CDF_market_approach_grid_run_detail_failure_reason_score] DEFAULT ((0)) NOT NULL,
    [failure_reason_differential] BIT         CONSTRAINT [CDF_market_approach_grid_run_detail_failure_reason_differential] DEFAULT ((0)) NOT NULL,
    [is_outlier]                  BIT         CONSTRAINT [CDF_market_approach_grid_run_detail_is_outlier] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_market_approach_grid_run_detail] PRIMARY KEY CLUSTERED ([run_id] ASC, [detail_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_market_approach_grid_run_detail_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[market_approach_grid_run] ([run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains list of Market Approach Grid Maintenance run detail properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'market_approach_grid_run_detail';


GO

