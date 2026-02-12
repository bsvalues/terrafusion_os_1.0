CREATE TABLE [dbo].[fee_prop_assoc] (
    [fee_id]  INT NOT NULL,
    [prop_id] INT NOT NULL,
    CONSTRAINT [CPK_fee_prop_assoc] PRIMARY KEY CLUSTERED ([fee_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[fee_prop_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

