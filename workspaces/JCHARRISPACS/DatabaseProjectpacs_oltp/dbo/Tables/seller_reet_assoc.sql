CREATE TABLE [dbo].[seller_reet_assoc] (
    [reet_id]    INT NOT NULL,
    [seller_id]  INT NOT NULL,
    [is_primary] BIT NOT NULL,
    [prop_id]    INT NOT NULL,
    CONSTRAINT [CPK_seller_reet_assoc] PRIMARY KEY CLUSTERED ([reet_id] ASC, [seller_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_seller_reet_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_seller_reet_assoc_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

