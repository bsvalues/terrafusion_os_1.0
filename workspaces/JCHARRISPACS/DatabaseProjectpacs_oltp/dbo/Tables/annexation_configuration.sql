CREATE TABLE [dbo].[annexation_configuration] (
    [year]                        NUMERIC (4) NOT NULL,
    [coterminous_start_date]      DATETIME    NULL,
    [coterminous_cutoff_date]     DATETIME    NULL,
    [non_coterminous_start_date]  DATETIME    NULL,
    [non_coterminous_cutoff_date] DATETIME    NULL,
    CONSTRAINT [CPK_annexation_configuration] PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 100)
);


GO

