CREATE TABLE [dbo].[mineral_import_options] (
    [year]                          NUMERIC (4) NOT NULL,
    [appr_company_id]               INT         NOT NULL,
    [exclude_zero_value_properties] BIT         NOT NULL,
    [preview_record_count]          INT         NULL,
    CONSTRAINT [CPK_mineral_import_options] PRIMARY KEY CLUSTERED ([year] ASC, [appr_company_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mineral_import_options_appr_company_id] FOREIGN KEY ([appr_company_id]) REFERENCES [dbo].[appr_company] ([appr_company_id])
);


GO

