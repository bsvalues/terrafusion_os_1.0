CREATE TABLE [dbo].[pacs_rounding_factor] (
    [prop_val_yr]            NUMERIC (18) NOT NULL,
    [rounding_factor]        NUMERIC (18) NULL,
    [rounding_income_factor] NUMERIC (18) NULL,
    CONSTRAINT [CPK_pacs_rounding_factor] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

