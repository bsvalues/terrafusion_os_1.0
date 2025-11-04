CREATE TABLE [dbo].[tif_area_prop_values] (
    [tif_area_id]       INT          NOT NULL,
    [prop_id]           INT          NOT NULL,
    [base_value]        NUMERIC (14) NULL,
    [senior_base_value] NUMERIC (14) NULL,
    CONSTRAINT [cpk_tif_area_prop_values] PRIMARY KEY CLUSTERED ([tif_area_id] ASC, [prop_id] ASC),
    CONSTRAINT [fk_tif_area_prop_values_property] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [fk_tif_area_prop_values_tif_area] FOREIGN KEY ([tif_area_id]) REFERENCES [dbo].[tif_area] ([tif_area_id])
);


GO

