CREATE TABLE [dbo].[dor_depreciation_imported_schedule_data] (
    [run_id]            INT            NOT NULL,
    [dor_schedule_code] VARCHAR (25)   NOT NULL,
    [age]               INT            NOT NULL,
    [percentage]        DECIMAL (5, 2) NOT NULL,
    CONSTRAINT [CPK_dor_depreciation_imported_schedule_data] PRIMARY KEY CLUSTERED ([run_id] ASC, [dor_schedule_code] ASC, [age] ASC),
    CONSTRAINT [FK_dor_depreciation_imported_schedule_data_dor_schedule_code] FOREIGN KEY ([dor_schedule_code]) REFERENCES [dbo].[dor_depreciation_schedule] ([code])
);


GO

