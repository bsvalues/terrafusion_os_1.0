CREATE TABLE [dbo].[tif_area_bill_values] (
    [tif_area_id]     INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [year]            NUMERIC (4)  NOT NULL,
    [sup_num]         INT          NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [remainder_nc]    NUMERIC (14) NULL,
    [increment_nc]    NUMERIC (14) NULL,
    [remainder_c]     NUMERIC (14) NULL,
    [increment_c]     NUMERIC (14) NULL,
    CONSTRAINT [cpk_tif_area_bill_values] PRIMARY KEY CLUSTERED ([tif_area_id] ASC, [prop_id] ASC, [year] ASC, [sup_num] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [cfk_tif_area_bill_values_property_val] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id]),
    CONSTRAINT [cfk_tif_area_bill_values_tif_area] FOREIGN KEY ([tif_area_id]) REFERENCES [dbo].[tif_area] ([tif_area_id])
);


GO

