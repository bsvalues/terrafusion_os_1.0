CREATE TABLE [dbo].[ms_config] (
    [year]                   NUMERIC (4) NOT NULL,
    [commercial_enabled]     BIT         NOT NULL,
    [commercial_loaded]      BIT         NOT NULL,
    [residential_enabled]    BIT         NOT NULL,
    [residential_loaded]     BIT         NOT NULL,
    [commercial_report_date] DATETIME    NULL,
    CONSTRAINT [CPK_ms_config] PRIMARY KEY CLUSTERED ([year] ASC)
);


GO

