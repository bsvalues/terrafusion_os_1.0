CREATE TABLE [dbo].[_rbk_bpd_20230508] (
    [bill_id]           INT             NOT NULL,
    [bill_payment_id]   INT             NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL,
    [is_payout_payment] BIT             NOT NULL
);


GO

