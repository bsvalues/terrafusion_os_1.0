CREATE TABLE [dbo].[oracle_ap_invoice_lines_interface] (
    [invoice_id]               NUMERIC (15)    NULL,
    [invoice_line_id]          NUMERIC (15)    NULL,
    [line_number]              NUMERIC (15)    NULL,
    [line_type_lookup_code]    VARCHAR (25)    NULL,
    [amount]                   NUMERIC (14, 2) NULL,
    [accounting_date]          DATETIME        NULL,
    [description]              VARCHAR (240)   NULL,
    [amount_includes_tax_flag] VARCHAR (1)     NULL,
    [tax_code]                 VARCHAR (15)    NULL,
    [dist_code_concatenated]   VARCHAR (250)   NULL,
    [last_updated_by]          NUMERIC (15)    NULL,
    [last_update_date]         DATETIME        NULL,
    [last_update_login]        NUMERIC (15)    NULL,
    [created_by]               NUMERIC (15)    NULL,
    [creation_date]            DATETIME        NULL,
    [org_id]                   NUMERIC (15)    NULL,
    [exported]                 BIT             CONSTRAINT [CDF_oracle_ap_invoice_lines_interface_exported] DEFAULT ((0)) NOT NULL
);


GO

