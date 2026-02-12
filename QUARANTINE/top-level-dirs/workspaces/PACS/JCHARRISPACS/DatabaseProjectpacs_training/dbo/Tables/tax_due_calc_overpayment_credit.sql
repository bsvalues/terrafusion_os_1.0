CREATE TABLE [dbo].[tax_due_calc_overpayment_credit] (
    [dataset_id]        INT             NOT NULL,
    [overpmt_credit_id] INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [prop_id]           INT             NOT NULL,
    [owner_id]          INT             NOT NULL,
    [amount_base]       NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    CONSTRAINT [CPK_tax_due_calc_overpayment_credit] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [overpmt_credit_id] ASC) WITH (FILLFACTOR = 100)
);


GO

