CREATE TABLE [dbo].[property_lien_assoc] (
    [lien_id] INT NOT NULL,
    [prop_id] INT NOT NULL,
    CONSTRAINT [CFK_property_lien_assoc_property_lien] FOREIGN KEY ([lien_id]) REFERENCES [dbo].[property_lien] ([lien_id])
);


GO

