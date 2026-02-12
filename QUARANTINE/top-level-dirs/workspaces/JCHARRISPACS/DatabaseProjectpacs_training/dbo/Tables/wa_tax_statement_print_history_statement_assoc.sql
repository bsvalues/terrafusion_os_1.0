CREATE TABLE [dbo].[wa_tax_statement_print_history_statement_assoc] (
    [group_id]       INT         NOT NULL,
    [year]           NUMERIC (4) NOT NULL,
    [run_id]         INT         NOT NULL,
    [history_id]     INT         NOT NULL,
    [copy_type]      BIGINT      NOT NULL,
    [prop_id]        INT         NOT NULL,
    [owner_id]       INT         NOT NULL,
    [sup_num]        INT         NOT NULL,
    [statement_id]   INT         NOT NULL,
    [order_seq]      INT         IDENTITY (1, 1) NOT NULL,
    [segment_number] INT         NULL,
    CONSTRAINT [CPK_wa_tax_statement_print_history_statement_assoc] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [history_id] ASC, [statement_id] ASC, [copy_type] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_tax_statement_print_history_statement_assoc_group_id_year_run_id_statement_id_copy_type] FOREIGN KEY ([group_id], [year], [run_id], [statement_id], [copy_type]) REFERENCES [dbo].[wa_tax_statement] ([group_id], [year], [run_id], [statement_id], [copy_type]) ON DELETE CASCADE,
    CONSTRAINT [CFK_wa_tax_statement_print_history_statement_assoc_year_group_id_run_id_history_id] FOREIGN KEY ([year], [group_id], [run_id], [history_id]) REFERENCES [dbo].[wa_tax_statement_print_history] ([year], [group_id], [run_id], [history_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This column ensures that printing bulk tax statement will generate segmented report export files.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history_statement_assoc', @level2type = N'COLUMN', @level2name = N'segment_number';


GO

