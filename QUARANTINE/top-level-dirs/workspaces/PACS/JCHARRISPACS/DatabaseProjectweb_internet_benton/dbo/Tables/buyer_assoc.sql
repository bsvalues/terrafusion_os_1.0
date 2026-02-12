CREATE TABLE [dbo].[buyer_assoc] (
    [chg_of_owner_id] INT NOT NULL,
    [buyer_id]        INT NOT NULL,
    CONSTRAINT [CPK_buyer_assoc] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC, [buyer_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_buyer_id]
    ON [dbo].[buyer_assoc]([buyer_id] ASC) WITH (FILLFACTOR = 90);


GO

