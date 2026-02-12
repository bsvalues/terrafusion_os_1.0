CREATE TABLE [dbo].[_clientdb_pacs_year] (
    [tax_yr]              NUMERIC (4) NOT NULL,
    [certification_dt]    DATETIME    NULL,
    [prev_reappraised_yr] NUMERIC (4) NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_pacs_year]
    ON [dbo].[_clientdb_pacs_year]([tax_yr] ASC);


GO

