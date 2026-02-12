CREATE TABLE [dbo].[entity_tax_statement_run] (
    [levy_group_id]              INT          NOT NULL,
    [levy_year]                  NUMERIC (4)  NOT NULL,
    [levy_sup_num]               INT          NOT NULL,
    [levy_run]                   INT          NOT NULL,
    [levy_stmnt_type]            CHAR (1)     NULL,
    [levy_sort_order]            CHAR (1)     NULL,
    [real_prop]                  CHAR (1)     NULL,
    [personal_prop]              CHAR (1)     NULL,
    [mobile_prop]                CHAR (1)     NULL,
    [auto_prop]                  CHAR (1)     NULL,
    [mineral_prop]               CHAR (1)     NULL,
    [created_by]                 INT          NULL,
    [created_date]               DATETIME     NULL,
    [run_type]                   CHAR (1)     NULL,
    [default_tax_statement_form] VARCHAR (15) NULL,
    CONSTRAINT [CPK_entity_tax_statement_run] PRIMARY KEY CLUSTERED ([levy_group_id] ASC, [levy_year] ASC, [levy_sup_num] ASC, [levy_run] ASC) WITH (FILLFACTOR = 100)
);


GO

