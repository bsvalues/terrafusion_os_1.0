CREATE TABLE [dbo].[pacs_levy] (
    [tax_yr]          NUMERIC (18) NOT NULL,
    [system_prep]     CHAR (1)     NULL,
    [bills_created]   CHAR (1)     NULL,
    [stmnt_created]   CHAR (1)     NULL,
    [bills_activated] CHAR (1)     NULL,
    [move_new_year]   CHAR (1)     NULL,
    CONSTRAINT [CPK_pacs_levy] PRIMARY KEY CLUSTERED ([tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

