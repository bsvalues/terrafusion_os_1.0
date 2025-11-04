CREATE TABLE [dbo].[buyer_reet_assoc] (
    [reet_id]    INT NOT NULL,
    [buyer_id]   INT NOT NULL,
    [is_primary] BIT NOT NULL,
    CONSTRAINT [CPK_buyer_reet_assoc] PRIMARY KEY CLUSTERED ([reet_id] ASC, [buyer_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_buyer_reet_assoc_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

