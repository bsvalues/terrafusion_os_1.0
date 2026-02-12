CREATE TABLE [dbo].[pacs_year] (
    [tax_yr]                        NUMERIC (4) NOT NULL,
    [certification_dt]              DATETIME    NULL,
    [notice_dt]                     DATETIME    NULL,
    [prev_reappraised_yr]           NUMERIC (4) NULL,
    [assessment_certification_date] DATETIME    NULL,
    CONSTRAINT [CPK_pacs_year] PRIMARY KEY CLUSTERED ([tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

