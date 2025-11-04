CREATE TABLE [dbo].[reet_fee_assoc] (
    [reet_id] INT NOT NULL,
    [fee_id]  INT NOT NULL,
    CONSTRAINT [CPK_reet_fee_assoc] PRIMARY KEY CLUSTERED ([reet_id] ASC, [fee_id] ASC),
    CONSTRAINT [CFK_reet_fee_assoc_fee_id] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[fee] ([fee_id]),
    CONSTRAINT [CFK_reet_fee_assoc_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_fee_id]
    ON [dbo].[reet_fee_assoc]([fee_id] ASC) WITH (FILLFACTOR = 90);


GO

