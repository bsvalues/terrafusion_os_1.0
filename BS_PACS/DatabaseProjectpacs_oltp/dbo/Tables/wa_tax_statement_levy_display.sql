CREATE TABLE [dbo].[wa_tax_statement_levy_display] (
    [group_id]            INT              NOT NULL,
    [year]                NUMERIC (4)      NOT NULL,
    [run_id]              INT              NOT NULL,
    [statement_id]        INT              NOT NULL,
    [tax_district_id]     INT              NOT NULL,
    [voted]               BIT              NOT NULL,
    [levy_rate]           NUMERIC (13, 10) NOT NULL,
    [tax_amount]          NUMERIC (14, 2)  NOT NULL,
    [order_num]           INT              NULL,
    [taxable_value]       NUMERIC (18)     NULL,
    [levy_cd]             VARCHAR (20)     NOT NULL,
    [levy_description]    VARCHAR (255)    NULL,
    [main]                BIT              NOT NULL,
    [prior_yr_tax_amount] NUMERIC (14, 2)  CONSTRAINT [CDF_wa_tax_statement_levy_display_prior_yr_tax_amount] DEFAULT ((0)) NOT NULL,
    [levy_part]           INT              CONSTRAINT [CDF_wa_tax_statement_levy_display_levy_part] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_levy_display] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [tax_district_id] ASC, [voted] ASC, [levy_cd] ASC, [main] ASC, [levy_part] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[wa_tax_statement_levy_display]([run_id] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stores main', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display', @level2type = N'COLUMN', @level2name = N'main';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Prior Year Tax Amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display', @level2type = N'COLUMN', @level2name = N'prior_yr_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Part Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display', @level2type = N'COLUMN', @level2name = N'levy_part';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The taxable value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display', @level2type = N'COLUMN', @level2name = N'taxable_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stores levy code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display', @level2type = N'COLUMN', @level2name = N'levy_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stores levy description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display', @level2type = N'COLUMN', @level2name = N'levy_description';


GO

