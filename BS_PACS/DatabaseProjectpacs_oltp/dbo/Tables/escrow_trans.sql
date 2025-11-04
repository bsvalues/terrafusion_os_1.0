CREATE TABLE [dbo].[escrow_trans] (
    [escrow_transaction_id] INT             NOT NULL,
    [escrow_id]             INT             NOT NULL,
    [owner_id]              INT             NULL,
    [prop_id]               INT             NULL,
    [year]                  NUMERIC (4)     NULL,
    [amount]                DECIMAL (14, 2) NULL,
    [status]                VARCHAR (5)     NULL,
    [month]                 NUMERIC (2)     NULL,
    CONSTRAINT [CPK_escrow_trans] PRIMARY KEY CLUSTERED ([escrow_transaction_id] ASC, [escrow_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_escrow_trans_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

