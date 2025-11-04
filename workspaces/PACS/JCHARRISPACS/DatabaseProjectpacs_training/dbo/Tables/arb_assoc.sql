CREATE TABLE [dbo].[arb_assoc] (
    [prop_id]    INT NOT NULL,
    [arb_inq_id] INT NOT NULL,
    CONSTRAINT [CPK_arb_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [arb_inq_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_arb_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[arb_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_arb_inq_id]
    ON [dbo].[arb_assoc]([arb_inq_id] ASC) WITH (FILLFACTOR = 90);


GO

