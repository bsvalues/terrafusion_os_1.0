CREATE TABLE [dbo].[td_srr_tax_area_assoc] (
    [option_id]   INT NOT NULL,
    [tax_area_id] INT NOT NULL,
    CONSTRAINT [CPK_td_srr_tax_area_assoc] PRIMARY KEY CLUSTERED ([option_id] ASC, [tax_area_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_td_srr_tax_area_assoc_option_id] FOREIGN KEY ([option_id]) REFERENCES [dbo].[td_srr_options] ([option_id])
);


GO

