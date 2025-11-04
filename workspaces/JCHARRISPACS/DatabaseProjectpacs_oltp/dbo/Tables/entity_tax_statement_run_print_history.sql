CREATE TABLE [dbo].[entity_tax_statement_run_print_history] (
    [levy_group_id]                 INT         NOT NULL,
    [levy_year]                     NUMERIC (4) NOT NULL,
    [levy_sup_num]                  INT         NOT NULL,
    [levy_run]                      INT         NOT NULL,
    [history_id]                    INT         NOT NULL,
    [printed_by]                    INT         NULL,
    [printed_date]                  DATETIME    NULL,
    [print_option]                  CHAR (2)    NULL,
    [print_zero_due]                CHAR (1)    NULL,
    [print_agent_only_copy]         CHAR (1)    NULL,
    [print_agent_taxpayer_copy]     CHAR (1)    NULL,
    [print_mortgage_only_copy]      CHAR (1)    NULL,
    [print_mortgage_taxpayer_copy]  CHAR (1)    NULL,
    [print_indiv_agent_id]          INT         NULL,
    [print_indiv_mort_id]           INT         NULL,
    [print_si]                      CHAR (1)    NULL,
    [print_undeliverable]           CHAR (1)    NULL,
    [print_foreign_addr]            CHAR (1)    NULL,
    [print_ov65_zero_due]           CHAR (1)    NULL,
    [print_begin_option]            CHAR (1)    NULL,
    [print_begin_id]                INT         NULL,
    [print_mortgage_none]           CHAR (1)    NULL,
    [print_agent_none]              CHAR (1)    NULL,
    [print_taxserver_only_copy]     CHAR (1)    NULL,
    [print_taxserver_taxpayer_copy] CHAR (1)    NULL,
    [print_indiv_taxserver_id]      INT         NULL,
    [print_taxserver_none]          CHAR (1)    NULL,
    [print_half_payment]            CHAR (1)    NULL,
    CONSTRAINT [CPK_entity_tax_statement_run_print_history] PRIMARY KEY CLUSTERED ([levy_group_id] ASC, [levy_year] ASC, [levy_sup_num] ASC, [levy_run] ASC, [history_id] ASC) WITH (FILLFACTOR = 100)
);


GO

