CREATE TABLE [dbo].[seller_assoc] (
    [seller_id]       INT NOT NULL,
    [chg_of_owner_id] INT NOT NULL,
    [prop_id]         INT NOT NULL,
    CONSTRAINT [CPK_seller_assoc] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC, [prop_id] ASC, [seller_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[seller_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

