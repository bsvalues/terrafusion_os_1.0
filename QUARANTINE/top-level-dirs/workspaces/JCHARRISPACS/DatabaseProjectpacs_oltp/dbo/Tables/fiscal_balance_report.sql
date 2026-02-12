CREATE TABLE [dbo].[fiscal_balance_report] (
    [dataset_id]     INT             NOT NULL,
    [report_dt]      DATETIME        NULL,
    [beginning_cash] NUMERIC (14, 2) NULL,
    [net_deposit]    NUMERIC (14, 2) NULL,
    [gl_journal]     NUMERIC (14, 2) NULL,
    [day_refunds]    NUMERIC (14, 2) NULL,
    [month_refunds]  NUMERIC (14, 2) NULL,
    [year_refunds]   NUMERIC (14, 2) NULL,
    [ap_file]        NUMERIC (14, 2) NULL,
    [cad_name]       VARCHAR (50)    NULL
);


GO

