CREATE TABLE [dbo].[tax_area_event_assoc] (
    [tax_area_id] INT NOT NULL,
    [event_id]    INT NOT NULL,
    CONSTRAINT [CPK_tax_area_event_assoc] PRIMARY KEY CLUSTERED ([tax_area_id] ASC, [event_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tax_area_event_assoc_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id]),
    CONSTRAINT [CFK_tax_area_event_assoc_tax_area_id] FOREIGN KEY ([tax_area_id]) REFERENCES [dbo].[tax_area] ([tax_area_id])
);


GO

