CREATE TABLE [dbo].[dor_depreciation_imported_schedule] (
    [run_id]            INT          NOT NULL,
    [dor_schedule_code] VARCHAR (25) NOT NULL,
    [match_type_cd]     CHAR (10)    NULL,
    [match_deprec_cd]   CHAR (10)    NULL,
    [is_matched]        BIT          DEFAULT ((0)) NOT NULL,
    [is_processed]      BIT          DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_dor_depreciation_imported_schedule] PRIMARY KEY CLUSTERED ([run_id] ASC, [dor_schedule_code] ASC),
    CONSTRAINT [FK_dor_depreciation_imported_schedule_dor_schedule_code] FOREIGN KEY ([dor_schedule_code]) REFERENCES [dbo].[dor_depreciation_schedule] ([code]),
    CONSTRAINT [FK_dor_depreciation_imported_schedule_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[dor_depreciation_import_run] ([run_id])
);


GO

