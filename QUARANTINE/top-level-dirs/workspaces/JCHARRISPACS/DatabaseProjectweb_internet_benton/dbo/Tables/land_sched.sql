CREATE TABLE [dbo].[land_sched] (
    [ls_id]              INT             NOT NULL,
    [ls_year]            NUMERIC (4)     NOT NULL,
    [ls_code]            CHAR (25)       NOT NULL,
    [ls_ag_or_mkt]       CHAR (1)        NOT NULL,
    [ls_method]          CHAR (5)        NOT NULL,
    [ls_interpolate]     CHAR (1)        NULL,
    [ls_up]              NUMERIC (14, 2) NULL,
    [ls_base_price]      NUMERIC (14, 2) NULL,
    [ls_std_depth]       NUMERIC (14, 4) NULL,
    [ls_plus_dev_ft]     NUMERIC (14, 4) NULL,
    [ls_plus_dev_amt]    NUMERIC (14, 2) NULL,
    [ls_minus_dev_ft]    NUMERIC (14, 4) NULL,
    [ls_minus_dev_amt]   NUMERIC (14, 2) NULL,
    [changed_flag]       CHAR (1)        NULL,
    [ls_ff_type]         CHAR (1)        NULL,
    [ls_slope_intercept] BIT             NULL,
    [matrix_id]          INT             NULL,
    CONSTRAINT [CPK_land_sched] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_ls_method]
    ON [dbo].[land_sched]([ls_method] ASC) WITH (FILLFACTOR = 90);


GO

