CREATE TABLE [dbo].[wa_tax_statement_config] (
    [statement_option]     INT           NOT NULL,
    [year]                 NUMERIC (4)   NOT NULL,
    [print_on_back_option] INT           DEFAULT ((0)) NOT NULL,
    [message]              VARCHAR (525) NULL,
    [print_levy_details]   BIT           DEFAULT ((1)) NULL,
    [print_levy_rates]     BIT           DEFAULT ((1)) NULL,
    [print_taxable_value]  BIT           DEFAULT ((1)) NULL,
    [print_addr_change]    BIT           DEFAULT ((0)) NULL,
    [default_for_print]    BIT           DEFAULT ((0)) NULL,
    [print_prev_year]      BIT           CONSTRAINT [CDF_wa_tax_statement_config_print_prev_year] DEFAULT ((1)) NOT NULL,
    [effective_date]       BIT           CONSTRAINT [CDF_wa_tax_statement_config_effective_date] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_config] PRIMARY KEY CLUSTERED ([statement_option] ASC, [year] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_tax_statement_config_statement_option] FOREIGN KEY ([statement_option]) REFERENCES [dbo].[wa_tax_statement_option_type] ([statement_option])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'store report setting - print previous year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_config', @level2type = N'COLUMN', @level2name = N'print_prev_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Set option to use effective date or bill due date for coupon on tax statement', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_config', @level2type = N'COLUMN', @level2name = N'effective_date';


GO

