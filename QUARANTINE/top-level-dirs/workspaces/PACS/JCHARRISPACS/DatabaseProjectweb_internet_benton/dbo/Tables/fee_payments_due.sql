CREATE TABLE [dbo].[fee_payments_due] (
    [fee_id]            INT             NOT NULL,
    [fee_payment_id]    INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL,
    [is_payout_payment] BIT             NOT NULL,
    CONSTRAINT [CPK_fee_payments_due] PRIMARY KEY CLUSTERED ([fee_id] ASC, [fee_payment_id] ASC, [year] ASC)
);


GO

