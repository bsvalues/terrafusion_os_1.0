CREATE TABLE [dbo].[tax_due_calc_fee] (
    [dataset_id]             INT             NOT NULL,
    [fee_id]                 INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [initial_amount_due]     NUMERIC (14, 2) NOT NULL,
    [current_amount_due]     NUMERIC (14, 2) NOT NULL,
    [amount_paid]            NUMERIC (14, 2) NOT NULL,
    [fee_type_cd]            VARCHAR (10)    NULL,
    [effective_due_date]     DATETIME        NULL,
    [statement_id]           INT             NULL,
    [payment_status_type_cd] VARCHAR (10)    NULL,
    CONSTRAINT [CPK_tax_due_calc_fee] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [fee_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_dataset_id_year_statement_id]
    ON [dbo].[tax_due_calc_fee]([dataset_id] ASC, [year] ASC, [statement_id] ASC) WITH (FILLFACTOR = 90);


GO

