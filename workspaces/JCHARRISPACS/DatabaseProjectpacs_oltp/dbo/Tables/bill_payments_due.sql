CREATE TABLE [dbo].[bill_payments_due] (
    [bill_id]           INT             NOT NULL,
    [bill_payment_id]   INT             NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL,
    [is_payout_payment] BIT             CONSTRAINT [CDF_bill_payments_due_is_payout_payment] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_bill_payments_due] PRIMARY KEY CLUSTERED ([bill_id] ASC, [bill_payment_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_bill_payments_due_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[bill] ([bill_id])
);


GO

