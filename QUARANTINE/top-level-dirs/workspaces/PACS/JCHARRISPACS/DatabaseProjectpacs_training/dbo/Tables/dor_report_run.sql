CREATE TABLE [dbo].[dor_report_run] (
    [dataset_id] INT      NOT NULL,
    [run_dt]     DATETIME NOT NULL,
    CONSTRAINT [CPK_dor_report_run] PRIMARY KEY CLUSTERED ([dataset_id] ASC) WITH (FILLFACTOR = 100)
);


GO

