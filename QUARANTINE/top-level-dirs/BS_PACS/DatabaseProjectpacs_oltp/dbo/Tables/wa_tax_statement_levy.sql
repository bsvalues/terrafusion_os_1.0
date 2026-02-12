CREATE TABLE [dbo].[wa_tax_statement_levy] (
    [group_id]            INT              NOT NULL,
    [year]                NUMERIC (4)      NOT NULL,
    [run_id]              INT              NOT NULL,
    [statement_id]        INT              NOT NULL,
    [tax_district_id]     INT              NOT NULL,
    [voted]               BIT              NOT NULL,
    [levy_rate]           NUMERIC (13, 10) NOT NULL,
    [tax_amount]          NUMERIC (14, 2)  NOT NULL,
    [order_num]           INT              NULL,
    [gross_tax_amount]    NUMERIC (14, 2)  NULL,
    [prior_yr_tax_amount] NUMERIC (14, 2)  CONSTRAINT [CDF_wa_tax_statement_levy_prior_yr_tax_amount] DEFAULT ((0)) NOT NULL,
    [levy_part]           INT              CONSTRAINT [CDF_wa_tax_statement_levy_levy_part] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_levy] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [tax_district_id] ASC, [voted] ASC, [levy_part] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The taxes without exemptions', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy', @level2type = N'COLUMN', @level2name = N'gross_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Prior Year Tax Amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy', @level2type = N'COLUMN', @level2name = N'prior_yr_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Part Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy', @level2type = N'COLUMN', @level2name = N'levy_part';


GO

