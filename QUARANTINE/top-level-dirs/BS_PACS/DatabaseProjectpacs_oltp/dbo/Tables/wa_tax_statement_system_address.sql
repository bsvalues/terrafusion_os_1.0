CREATE TABLE [dbo].[wa_tax_statement_system_address] (
    [group_id]                       INT          NOT NULL,
    [year]                           NUMERIC (4)  NOT NULL,
    [run_id]                         INT          NOT NULL,
    [property_tax_questions_phone]   VARCHAR (15) NULL,
    [internet_address]               VARCHAR (50) NULL,
    [property_value_questions_phone] VARCHAR (15) NULL,
    [county_logo]                    VARCHAR (50) NULL,
    [treasurer_name]                 VARCHAR (50) NULL,
    [addr_line1]                     VARCHAR (50) NULL,
    [addr_line2]                     VARCHAR (50) NULL,
    [addr_line3]                     VARCHAR (50) NULL,
    [addr_city]                      VARCHAR (50) NULL,
    [addr_state]                     VARCHAR (2)  NULL,
    [addr_zip]                       VARCHAR (50) NULL,
    [office_hours_line1]             VARCHAR (50) NULL,
    [office_hours_line2]             VARCHAR (50) NULL,
    [office_hours_line3]             VARCHAR (50) NULL,
    [county_name]                    VARCHAR (30) NULL,
    [office_name]                    VARCHAR (50) NULL,
    [remittance_addr_line1]          VARCHAR (60) NULL,
    [remittance_addr_line2]          VARCHAR (60) NULL,
    [remittance_addr_line3]          VARCHAR (60) NULL,
    [remittance_addr_city]           VARCHAR (50) NULL,
    [remittance_addr_state]          VARCHAR (2)  NULL,
    [remittance_addr_zip]            VARCHAR (15) NULL,
    CONSTRAINT [CPK_wa_tax_statement_system_address] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_tax_statement_system_address_group_id_year_run_id] FOREIGN KEY ([group_id], [year], [run_id]) REFERENCES [dbo].[wa_tax_statement_run] ([group_id], [year], [run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line 1', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_line1';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line 2', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_line2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line 3', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_line3';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line city', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_city';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line state', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_state';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line zip', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_zip';


GO

