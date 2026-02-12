CREATE TABLE [dbo].[wa_tax_statement_delinquent_history_current_run] (
    [group_id]        INT             NOT NULL,
    [year]            NUMERIC (4)     NOT NULL,
    [run_id]          INT             NOT NULL,
    [statement_id]    INT             NOT NULL,
    [delinquent_year] NUMERIC (4)     NOT NULL,
    [base_amount]     NUMERIC (14, 2) NULL,
    [interest_amount] NUMERIC (14, 2) NULL,
    [penalty_amount]  NUMERIC (14, 2) NULL,
    [total]           NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_wa_tax_statement_delinquent_history_current_run] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [delinquent_year] ASC)
);


GO

