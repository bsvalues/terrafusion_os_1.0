CREATE TABLE [dbo].[escrow_payments_due] (
    [escrow_id]         INT             NOT NULL,
    [escrow_payment_id] INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [amount_due]        NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [due_date]          DATETIME        NULL,
    CONSTRAINT [CPK_escrow_payments_due] PRIMARY KEY CLUSTERED ([escrow_id] ASC, [escrow_payment_id] ASC, [year] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_escrow_payments_due_escrow] FOREIGN KEY ([escrow_id]) REFERENCES [dbo].[escrow] ([escrow_id]) ON DELETE CASCADE
);


GO

