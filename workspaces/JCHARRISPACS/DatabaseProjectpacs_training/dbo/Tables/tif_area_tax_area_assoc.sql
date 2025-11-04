CREATE TABLE [dbo].[tif_area_tax_area_assoc] (
    [tif_area_id] INT NOT NULL,
    [tax_area_id] INT NOT NULL,
    CONSTRAINT [cpk_tif_area_tax_area_assoc] PRIMARY KEY CLUSTERED ([tif_area_id] ASC, [tax_area_id] ASC),
    CONSTRAINT [cfk_tif_area_tax_area_assoc_tax_area] FOREIGN KEY ([tax_area_id]) REFERENCES [dbo].[tax_area] ([tax_area_id]),
    CONSTRAINT [cfk_tif_area_tax_area_assoc_tif_area] FOREIGN KEY ([tif_area_id]) REFERENCES [dbo].[tif_area] ([tif_area_id])
);


GO

