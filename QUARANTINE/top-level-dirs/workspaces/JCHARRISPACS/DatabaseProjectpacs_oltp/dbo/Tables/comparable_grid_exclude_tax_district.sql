CREATE TABLE [dbo].[comparable_grid_exclude_tax_district] (
    [tax_district_id] INT NOT NULL,
    CONSTRAINT [CPK__comparable_grid_exclude_tax_district] PRIMARY KEY CLUSTERED ([tax_district_id] ASC),
    CONSTRAINT [CFK_comparable_grid_exclude_tax_district_tax_district_id] FOREIGN KEY ([tax_district_id]) REFERENCES [dbo].[tax_district] ([tax_district_id])
);


GO

