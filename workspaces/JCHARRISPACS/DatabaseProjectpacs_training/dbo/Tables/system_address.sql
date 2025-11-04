CREATE TABLE [dbo].[system_address] (
    [system_type]                    CHAR (1)        NOT NULL,
    [addr_line1]                     VARCHAR (50)    NULL,
    [addr_line2]                     VARCHAR (50)    NULL,
    [addr_line3]                     VARCHAR (50)    NULL,
    [city]                           VARCHAR (50)    NULL,
    [state]                          CHAR (2)        NULL,
    [zip]                            VARCHAR (50)    NULL,
    [cad_id_code]                    CHAR (3)        NULL,
    [phone_num]                      VARCHAR (25)    NULL,
    [phone_num2]                     VARCHAR (25)    NULL,
    [fax_num]                        VARCHAR (25)    NULL,
    [chief_appraiser]                VARCHAR (50)    NULL,
    [county_name]                    VARCHAR (30)    NULL,
    [office_name]                    VARCHAR (50)    NULL,
    [url]                            VARCHAR (50)    NULL,
    [property_tax_questions_phone]   VARCHAR (15)    NULL,
    [property_value_questions_phone] VARCHAR (15)    NULL,
    [county_logo]                    VARCHAR (200)   NULL,
    [office_hours_line1]             VARCHAR (50)    NULL,
    [office_hours_line2]             VARCHAR (50)    NULL,
    [office_hours_line3]             VARCHAR (50)    NULL,
    [county_logo_blob]               VARBINARY (MAX) NULL,
    [remittance_addr_line1]          VARCHAR (60)    NULL,
    [remittance_addr_line2]          VARCHAR (60)    NULL,
    [remittance_addr_line3]          VARCHAR (60)    NULL,
    [remittance_addr_city]           VARCHAR (50)    NULL,
    [remittance_addr_state]          VARCHAR (2)     NULL,
    [remittance_addr_zip]            VARCHAR (15)    NULL,
    CONSTRAINT [CPK_system_address] PRIMARY KEY CLUSTERED ([system_type] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line zip', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_zip';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line 3', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_line3';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line state', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_state';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line 2', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_line2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line city', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_city';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'remittance addr line 1', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'system_address', @level2type = N'COLUMN', @level2name = N'remittance_addr_line1';


GO

