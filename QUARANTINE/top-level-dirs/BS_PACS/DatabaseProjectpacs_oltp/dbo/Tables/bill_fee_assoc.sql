CREATE TABLE [dbo].[bill_fee_assoc] (
    [bill_id] INT NOT NULL,
    [fee_id]  INT NOT NULL,
    CONSTRAINT [CPK_bill_fee_assoc] PRIMARY KEY CLUSTERED ([bill_id] ASC, [fee_id] ASC),
    CONSTRAINT [CFK_bill_fee_assoc_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[bill] ([bill_id]),
    CONSTRAINT [CFK_bill_fee_assoc_fee_id] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[fee] ([fee_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_fee_id]
    ON [dbo].[bill_fee_assoc]([fee_id] ASC) WITH (FILLFACTOR = 90);


GO

