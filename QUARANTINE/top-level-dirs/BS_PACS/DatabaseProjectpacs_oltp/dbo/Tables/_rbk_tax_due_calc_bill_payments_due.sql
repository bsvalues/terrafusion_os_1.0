CREATE TABLE [dbo].[_rbk_tax_due_calc_bill_payments_due] (
    [dataset_id]              INT             NOT NULL,
    [bill_id]                 INT             NOT NULL,
    [payment_id]              INT             NOT NULL,
    [amt_penalty]             NUMERIC (14, 2) NOT NULL,
    [amt_interest]            NUMERIC (14, 2) NOT NULL,
    [amount_due]              NUMERIC (14, 2) NOT NULL,
    [amount_paid]             NUMERIC (14, 2) NOT NULL,
    [due_date]                DATETIME        NULL,
    [amt_bond_interest]       NUMERIC (14, 2) NOT NULL,
    [total_due_as_of_posting] NUMERIC (18, 2) NULL,
    [is_h1_payment]           BIT             NOT NULL,
    [is_delinquent]           BIT             NOT NULL
);


GO

