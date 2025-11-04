CREATE TABLE [dbo].[wa_tax_statement_history_bill_fee_assoc] (
    [year]         NUMERIC (4) NOT NULL,
    [statement_id] INT         NOT NULL,
    [bill_fee_id]  INT         NOT NULL,
    [id_type]      CHAR (1)    NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_history_bill_fee_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [statement_id] ASC, [bill_fee_id] ASC, [id_type] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_wa_tax_statement_history_bill_fee_assoc_year_statement_id] FOREIGN KEY ([year], [statement_id]) REFERENCES [dbo].[wa_tax_statement_history] ([year], [statement_id])
);


GO

