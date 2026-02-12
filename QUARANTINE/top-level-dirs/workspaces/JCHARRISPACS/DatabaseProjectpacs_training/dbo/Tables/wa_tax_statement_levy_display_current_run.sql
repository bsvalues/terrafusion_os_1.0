CREATE TABLE [dbo].[wa_tax_statement_levy_display_current_run] (
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
    [levy_description]    VARCHAR (255)    NULL,
    [main]                BIT              NOT NULL,
    [levy_cd]             VARCHAR (20)     NOT NULL,
    [prior_yr_tax_amount] NUMERIC (14, 2)  NULL,
    [levy_part]           INT              CONSTRAINT [CDF_wa_tax_statement_levy_display_current_run_levy_part] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_levy_display_current_run] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [tax_district_id] ASC, [voted] ASC, [levy_cd] ASC, [main] ASC, [levy_part] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[wa_tax_statement_levy_display_current_run]([run_id] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Part Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_levy_display_current_run', @level2type = N'COLUMN', @level2name = N'levy_part';


GO

