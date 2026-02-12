CREATE TABLE [dbo].[tax_area_reet_rate_assoc] (
    [reet_rate_id] INT NOT NULL,
    [tax_area_id]  INT NOT NULL,
    CONSTRAINT [CPK_tax_area_reet_rate_assoc] PRIMARY KEY CLUSTERED ([reet_rate_id] ASC, [tax_area_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tax_area_reet_rate_assoc_reet_rate_id] FOREIGN KEY ([reet_rate_id]) REFERENCES [dbo].[reet_rate] ([reet_rate_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_tax_area_reet_rate_assoc_tax_area_id] FOREIGN KEY ([tax_area_id]) REFERENCES [dbo].[tax_area] ([tax_area_id])
);


GO

