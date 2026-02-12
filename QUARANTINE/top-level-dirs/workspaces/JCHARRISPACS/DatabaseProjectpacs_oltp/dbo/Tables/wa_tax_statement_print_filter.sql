CREATE TABLE [dbo].[wa_tax_statement_print_filter] (
    [year]                 NUMERIC (4)  NOT NULL,
    [group_id]             INT          NOT NULL,
    [run_id]               INT          NOT NULL,
    [history_id]           INT          NOT NULL,
    [filter_id]            INT          NOT NULL,
    [include_on_statement] BIT          NOT NULL,
    [filter_type]          VARCHAR (20) NOT NULL,
    [filter_code]          VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_print_filter] PRIMARY KEY CLUSTERED ([year] ASC, [group_id] ASC, [run_id] ASC, [history_id] ASC, [filter_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_wa_tax_statement_print_filter_year_group_id_run_id_history_id] FOREIGN KEY ([year], [group_id], [run_id], [history_id]) REFERENCES [dbo].[wa_tax_statement_print_history] ([year], [group_id], [run_id], [history_id])
);


GO

