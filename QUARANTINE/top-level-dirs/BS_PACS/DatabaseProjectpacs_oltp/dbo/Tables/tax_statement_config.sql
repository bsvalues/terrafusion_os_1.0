CREATE TABLE [dbo].[tax_statement_config] (
    [tax_statement_cd]           VARCHAR (10)  NOT NULL,
    [tax_statement_desc]         VARCHAR (50)  NULL,
    [delinquent_assessment]      BIT           NULL,
    [rollback_due]               BIT           NULL,
    [delinquent_taxes]           BIT           NULL,
    [message]                    VARCHAR (240) NULL,
    [priority_number]            INT           NOT NULL,
    [suppress_prior_year_values] BIT           CONSTRAINT [CDF_tax_statement_config_suppress_prior_year_values] DEFAULT ((0)) NOT NULL,
    [supplement_reason]          BIT           CONSTRAINT [CDF_tax_statement_config_supplement_reason] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_tax_statement_config] PRIMARY KEY CLUSTERED ([tax_statement_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to indicate message used when Prior Year Values are suppressed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_statement_config', @level2type = N'COLUMN', @level2name = N'suppress_prior_year_values';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to indicate message used should be Supplement Reason of Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_statement_config', @level2type = N'COLUMN', @level2name = N'supplement_reason';


GO

