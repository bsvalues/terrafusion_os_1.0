CREATE TABLE [dbo].[wa_tax_statement_tax_history_comparison] (
    [group_id]             INT              NOT NULL,
    [year]                 NUMERIC (4)      NOT NULL,
    [run_id]               INT              NOT NULL,
    [statement_id]         INT              NOT NULL,
    [tax_district_id]      INT              NOT NULL,
    [voted]                BIT              NOT NULL,
    [curr_year_levy_rate]  NUMERIC (13, 10) NOT NULL,
    [curr_year_taxes]      NUMERIC (14, 2)  NOT NULL,
    [prior_year_levy_rate] NUMERIC (13, 10) NOT NULL,
    [prior_year_taxes]     NUMERIC (14, 2)  NOT NULL,
    [pct_change_levy_rate] NUMERIC (14, 2)  NOT NULL,
    [pct_change_taxes]     NUMERIC (14, 2)  NOT NULL,
    [order_num]            INT              NULL,
    [levy_part]            INT              CONSTRAINT [CDF_wa_tax_statement_tax_history_comparison_levy_part] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_tax_history_comparison] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [tax_district_id] ASC, [voted] ASC, [levy_part] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Part Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_tax_history_comparison', @level2type = N'COLUMN', @level2name = N'levy_part';


GO

