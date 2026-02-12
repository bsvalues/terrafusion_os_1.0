CREATE TABLE [dbo].[tax_due_calc_fee_payments_due] (
    [dataset_id]              INT             NOT NULL,
    [fee_id]                  INT             NOT NULL,
    [payment_id]              INT             NOT NULL,
    [amt_penalty]             NUMERIC (14, 2) NOT NULL,
    [amt_interest]            NUMERIC (14, 2) NOT NULL,
    [amount_due]              NUMERIC (14, 2) NOT NULL,
    [amount_paid]             NUMERIC (14, 2) NOT NULL,
    [due_date]                DATETIME        NULL,
    [amt_bond_interest]       NUMERIC (14, 2) NOT NULL,
    [total_due_as_of_posting] AS              (((([amount_due]-[amount_paid])+[amt_penalty])+[amt_interest])+[amt_bond_interest]),
    [is_h1_payment]           BIT             DEFAULT ((1)) NOT NULL,
    [is_delinquent]           BIT             DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_tax_due_calc_fee_payments_due] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [fee_id] ASC, [payment_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tax_due_calc_fee_payments_due_dataset_id_fee_id] FOREIGN KEY ([dataset_id], [fee_id]) REFERENCES [dbo].[tax_due_calc_fee] ([dataset_id], [fee_id]) ON DELETE CASCADE
);


GO

