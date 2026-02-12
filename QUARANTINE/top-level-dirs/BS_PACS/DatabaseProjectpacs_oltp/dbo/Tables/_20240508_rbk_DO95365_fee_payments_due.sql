CREATE TABLE [dbo].[_20240508_rbk_DO95365_fee_payments_due] (
    [fee_id]            INT             NOT NULL,
    [fee_payment_id]    INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL,
    [is_payout_payment] BIT             NOT NULL
);


GO

