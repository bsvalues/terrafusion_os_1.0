CREATE TABLE [dbo].[wa_tax_statement_print_history] (
    [year]                                 NUMERIC (4)    NOT NULL,
    [group_id]                             INT            NOT NULL,
    [run_id]                               INT            NOT NULL,
    [history_id]                           INT            NOT NULL,
    [print_description]                    VARCHAR (50)   NULL,
    [include_tax_area]                     BIT            NOT NULL,
    [include_tax_district]                 BIT            NOT NULL,
    [include_assessments]                  BIT            NOT NULL,
    [include_bill_adjust_code]             BIT            NOT NULL,
    [include_annexation]                   BIT            NOT NULL,
    [include_escrow_balance]               BIT            NOT NULL,
    [include_accounts_with_rollback]       BIT            NOT NULL,
    [exclude_tax_area]                     BIT            NOT NULL,
    [exclude_tax_district]                 BIT            NOT NULL,
    [exclude_assessments]                  BIT            NOT NULL,
    [exclude_bill_adjust_code]             BIT            NOT NULL,
    [exclude_annexation]                   BIT            NOT NULL,
    [exclude_escrow_balance]               BIT            NOT NULL,
    [exclude_accounts_with_rollback]       BIT            NOT NULL,
    [agent_copy]                           BIT            NOT NULL,
    [agent_copy_option]                    TINYINT        NOT NULL,
    [mortgage_copy]                        BIT            NOT NULL,
    [mortgage_copy_option]                 TINYINT        NOT NULL,
    [taxserver_copy]                       BIT            NOT NULL,
    [taxserver_copy_option]                TINYINT        NOT NULL,
    [include_undeliverable_address]        BIT            NOT NULL,
    [include_foreign_address]              BIT            NOT NULL,
    [include_zero_tax_due]                 BIT            NOT NULL,
    [begin_statement_id]                   INT            NULL,
    [end_statement_id]                     INT            NULL,
    [sort_option]                          VARCHAR (10)   NULL,
    [notice_date]                          DATETIME       NULL,
    [delinquent_prop_id]                   INT            NULL,
    [print_date]                           DATETIME       NULL,
    [num_printed]                          INT            NULL,
    [print_by]                             INT            NULL,
    [print_option]                         VARCHAR (5)    NULL,
    [print_option_account_id]              INT            NULL,
    [print_coupon_only]                    BIT            DEFAULT ((0)) NULL,
    [print_on_back_option]                 INT            DEFAULT ((1)) NULL,
    [print_addr_chg]                       BIT            DEFAULT ((0)) NULL,
    [print_levy_details]                   BIT            DEFAULT ((0)) NULL,
    [print_levy_rates]                     BIT            DEFAULT ((1)) NULL,
    [print_taxable_value]                  BIT            DEFAULT ((1)) NULL,
    [statement_option]                     INT            NULL,
    [include_agent_notice]                 BIT            NULL,
    [print_prev_year]                      BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_print_prev_year] DEFAULT ((1)) NOT NULL,
    [include_collection_pursuit]           BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_include_collection_pursuit] DEFAULT ((0)) NOT NULL,
    [exclude_collection_pursuit]           BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_exclude_collection_pursuit] DEFAULT ((0)) NOT NULL,
    [include_credit_balance_due]           BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_include_credit_balance_due] DEFAULT ((0)) NOT NULL,
    [effective_date]                       BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_effective_date] DEFAULT ((0)) NOT NULL,
    [include_property_group_code]          BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_include_property_group_code] DEFAULT ((0)) NOT NULL,
    [exclude_property_group_code]          BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_exclude_property_group_code] DEFAULT ((0)) NOT NULL,
    [include_zero_tax_due_for_senior_dsbl] BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_include_zero_tax_due_for_senior_dsbl] DEFAULT ((0)) NULL,
    [exclude_tax_due_less_than]            BIT            CONSTRAINT [CDF_wa_tax_statement_print_history_exclude_tax_due_less_than] DEFAULT ((0)) NULL,
    [exclude_tax_due_less_than_amount]     NUMERIC (9, 2) CONSTRAINT [CDF_wa_tax_statement_print_history_exclude_tax_due_less_than_amount] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_wa_tax_statement_print_history] PRIMARY KEY CLUSTERED ([year] ASC, [group_id] ASC, [run_id] ASC, [history_id] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Tax Due Less than amount to exclude from Statement', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'exclude_tax_due_less_than_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement option type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'statement_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if property group code exclusion filter criteria exists', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'exclude_property_group_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement print on back option', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_on_back_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if collection pursuit inclusion filter criteria exists', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'include_collection_pursuit';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Print the coupon only', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_coupon_only';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'store report setting - print previous year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_prev_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Verify if Statement should exclude Tax Due less than a specified amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'exclude_tax_due_less_than';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement print levy details bit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_levy_details';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include statements with a credit balance in the print run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'include_credit_balance_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement address change bit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_addr_chg';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if collection pursuit exclusion filter criteria exists', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'exclude_collection_pursuit';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement print taxable value bit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_taxable_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if property group code inclusion filter criteria exists', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'include_property_group_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The statement print levy rates bit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'print_levy_rates';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Set option to use effective date or bill due date for coupon on tax statement', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'effective_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The flag to indicate how agent copy should be set.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'include_agent_notice';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Verify if Statement should include Zero Tax Due for Senior Disabled', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_print_history', @level2type = N'COLUMN', @level2name = N'include_zero_tax_due_for_senior_dsbl';


GO

