CREATE TABLE [dbo].[_rbk_20240520_DO95836_bill_payments_due] (
    [bill_id]           INT             NOT NULL,
    [bill_payment_id]   INT             NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL,
    [is_payout_payment] BIT             NOT NULL
);


GO

