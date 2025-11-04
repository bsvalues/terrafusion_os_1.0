CREATE TABLE [dbo].[nbhd_cost_calc_capture] (
    [profile_run_list_detail_id]   INT             NOT NULL,
    [run_id]                       INT             NOT NULL,
    [hood_cd]                      VARCHAR (10)    NULL,
    [sample_size]                  INT             NULL,
    [sample_size_pct]              NUMERIC (14, 4) NULL,
    [population]                   INT             NULL,
    [prev_nbhd_adj]                NUMERIC (14, 2) NULL,
    [avg_land_sale]                NUMERIC (14, 4) NULL,
    [mean_ratio_begin]             NUMERIC (14, 4) NULL,
    [weighted_mean_begin]          NUMERIC (14, 4) NULL,
    [median_ratio_begin]           NUMERIC (14, 4) NULL,
    [avg_sale_begin]               NUMERIC (14)    NULL,
    [avg_sale_tla_begin]           NUMERIC (14, 2) NULL,
    [related_diff_begin]           NUMERIC (14, 2) NULL,
    [c_of_d_begin]                 NUMERIC (14, 4) NULL,
    [mean_ratio_updated]           NUMERIC (14, 4) NULL,
    [weighted_mean_updated]        NUMERIC (14, 4) NULL,
    [median_ratio_updated]         NUMERIC (14, 4) NULL,
    [avg_sale_updated]             NUMERIC (14)    NULL,
    [avg_sale_tla_updated]         NUMERIC (14, 2) NULL,
    [related_diff_updated]         NUMERIC (14, 2) NULL,
    [c_of_d_updated]               NUMERIC (14, 4) NULL,
    [adjust_mean]                  NUMERIC (14, 2) NULL,
    [adjust_median]                NUMERIC (14, 2) NULL,
    [adjust_used]                  NUMERIC (14, 2) NULL,
    [locked]                       BIT             CONSTRAINT [CDF_nbhd_cost_calc_capture_locked] DEFAULT (0) NULL,
    [target_ratio]                 NUMERIC (14, 4) CONSTRAINT [CDF_nbhd_cost_calc_capture_target_ratio] DEFAULT (1.0) NULL,
    [lock_user]                    INT             NULL,
    [lock_dt]                      DATETIME        NULL,
    [override_system_target_ratio] BIT             CONSTRAINT [CDF_nbhd_cost_calc_capture_override_system_target_ratio] DEFAULT (0) NOT NULL,
    [system_target_ratio]          NUMERIC (14, 4) CONSTRAINT [CDF_nbhd_cost_calc_capture_system_target_ratio] DEFAULT (100.00) NOT NULL,
    CONSTRAINT [CPK_nbhd_cost_calc_capture] PRIMARY KEY CLUSTERED ([profile_run_list_detail_id] ASC) WITH (FILLFACTOR = 100)
);


GO

