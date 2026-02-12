CREATE TABLE [dbo].[escrow_items_due] (
    [escrow_id]   INT NOT NULL,
    [item_id]     INT NOT NULL,
    [source_type] INT NOT NULL,
    [selected]    BIT NULL,
    CONSTRAINT [CPK_escrow_id_item_id] PRIMARY KEY CLUSTERED ([escrow_id] ASC, [item_id] ASC),
    CONSTRAINT [FK_escrow_items_due_escrow_id] FOREIGN KEY ([escrow_id]) REFERENCES [dbo].[escrow] ([escrow_id])
);


GO

