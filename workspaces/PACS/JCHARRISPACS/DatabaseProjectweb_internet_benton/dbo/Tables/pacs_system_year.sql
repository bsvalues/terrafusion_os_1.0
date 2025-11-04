CREATE TABLE [dbo].[pacs_system_year] (
    [pacs_yr]            NUMERIC (4) NOT NULL,
    [depreciation_yr]    NUMERIC (4) NULL,
    [pp_depreciation_yr] NUMERIC (4) NULL,
    CONSTRAINT [CPK_pacs_system_year] PRIMARY KEY CLUSTERED ([pacs_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

