CREATE TABLE [dbo].[levy_bill_transaction_assoc] (
    [posted_transaction_id] INT NOT NULL,
    [fund_id]               INT NULL,
    CONSTRAINT [CPK_levy_bill_transaction_assoc] PRIMARY KEY CLUSTERED ([posted_transaction_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_levy_bill_transaction_assoc_posted_transaction_id] FOREIGN KEY ([posted_transaction_id]) REFERENCES [dbo].[posted_coll_transaction] ([posted_transaction_id])
);


GO

CREATE NONCLUSTERED INDEX [IDX_levy_bill_transaction_assoc_fund_id]
    ON [dbo].[levy_bill_transaction_assoc]([fund_id] ASC) WITH (FILLFACTOR = 90);


GO

