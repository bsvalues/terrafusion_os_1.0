CREATE TABLE [dbo].[dor_depreciation_import_run] (
    [run_id]         INT         NOT NULL,
    [year]           NUMERIC (4) NOT NULL,
    [import_dt]      DATETIME    DEFAULT (getdate()) NULL,
    [match_dt]       DATETIME    NULL,
    [process_dt]     DATETIME    NULL,
    [import_user_id] INT         NOT NULL,
    CONSTRAINT [CPK_dor_depreciation_import_run] PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

