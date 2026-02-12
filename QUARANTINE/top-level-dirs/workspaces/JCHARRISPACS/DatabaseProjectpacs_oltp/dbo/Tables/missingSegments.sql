CREATE TABLE [dbo].[missingSegments] (
    [prop_id]         INT         NOT NULL,
    [prop_val_yr]     NUMERIC (4) NOT NULL,
    [land_count]      INT         NULL,
    [next_land_year]  NUMERIC (4) NULL,
    [imprv_count]     INT         NULL,
    [next_imprv_year] NUMERIC (4) NULL
);


GO

