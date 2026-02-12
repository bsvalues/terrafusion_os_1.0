CREATE TABLE [dbo].[escrow_worksheet_amounts_due_print_history] (
    [history_id]  INT             NOT NULL,
    [tax_year]    NUMERIC (4)     NOT NULL,
    [levy_amount] NUMERIC (14, 2) NOT NULL,
    [sa_amount]   NUMERIC (14, 2) NOT NULL,
    [fee_amount]  NUMERIC (14, 2) NOT NULL,
    [total]       NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_escrow_worksheet_amounts_due_print_history] PRIMARY KEY CLUSTERED ([history_id] ASC, [tax_year] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total for the values in this row', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_worksheet_amounts_due_print_history', @level2type = N'COLUMN', @level2name = N'total';


GO

