CREATE TABLE [dbo].[marshall_swift_config] (
    [year]     NUMERIC (4) NOT NULL,
    [ms_year]  INT         NULL,
    [ms_month] INT         NULL,
    CONSTRAINT [CPK_marshall_swift_config] PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 90)
);


GO

