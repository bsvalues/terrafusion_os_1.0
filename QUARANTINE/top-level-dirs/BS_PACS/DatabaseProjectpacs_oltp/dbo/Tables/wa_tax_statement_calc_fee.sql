CREATE TABLE [dbo].[wa_tax_statement_calc_fee] (
    [run_year]               NUMERIC (4)     NOT NULL,
    [group_id]               INT             NOT NULL,
    [run_id]                 INT             NOT NULL,
    [fee_id]                 INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [initial_amount_due]     NUMERIC (14, 2) NOT NULL,
    [current_amount_due]     NUMERIC (14, 2) NOT NULL,
    [amount_paid]            NUMERIC (14, 2) NOT NULL,
    [fee_type_cd]            VARCHAR (10)    NULL,
    [effective_due_date]     DATETIME        NULL,
    [statement_id]           INT             NULL,
    [payment_status_type_cd] VARCHAR (10)    NULL,
    CONSTRAINT [CPK_wa_tax_statement_calc_fee] PRIMARY KEY CLUSTERED ([run_year] ASC, [group_id] ASC, [run_id] ASC, [fee_id] ASC) WITH (FILLFACTOR = 100)
);


GO

