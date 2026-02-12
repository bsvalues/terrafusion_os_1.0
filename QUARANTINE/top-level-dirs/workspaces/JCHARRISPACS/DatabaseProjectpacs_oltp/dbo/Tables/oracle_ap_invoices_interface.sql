CREATE TABLE [dbo].[oracle_ap_invoices_interface] (
    [invoice_id]            NUMERIC (15)    NULL,
    [invoice_num]           VARCHAR (50)    NULL,
    [invoice_date]          DATETIME        NULL,
    [vendor_id]             NUMERIC (15)    NULL,
    [vendor_num]            VARCHAR (30)    NULL,
    [vendor_name]           VARCHAR (240)   NULL,
    [vendor_site_id]        NUMERIC (15)    NULL,
    [vendor_site_code]      VARCHAR (15)    NULL,
    [invoice_amount]        NUMERIC (14, 2) NULL,
    [invoice_currency_code] VARCHAR (15)    NULL,
    [terms_id]              NUMERIC (15)    NULL,
    [description]           VARCHAR (240)   NULL,
    [last_update_date]      DATETIME        NULL,
    [last_updated_by]       NUMERIC (15)    NULL,
    [last_update_login]     NUMERIC (15)    NULL,
    [creation_date]         DATETIME        NULL,
    [created_by]            NUMERIC (15)    NULL,
    [attribute_category]    VARCHAR (150)   NULL,
    [attribute1]            VARCHAR (150)   NULL,
    [attribute2]            VARCHAR (150)   NULL,
    [attribute3]            VARCHAR (150)   NULL,
    [attribute4]            VARCHAR (150)   NULL,
    [attribute5]            VARCHAR (150)   NULL,
    [attribute6]            VARCHAR (150)   NULL,
    [attribute7]            VARCHAR (150)   NULL,
    [source]                VARCHAR (80)    NULL,
    [group_id]              VARCHAR (80)    NULL,
    [pay_group_lookup_code] VARCHAR (25)    NULL,
    [gl_date]               DATETIME        NULL,
    [terms_date]            DATETIME        NULL,
    [exported]              BIT             CONSTRAINT [CDF_oracle_ap_invoices_interface_exported] DEFAULT ((0)) NOT NULL,
    [org_id]                INT             NULL,
    [invoice_received_date] DATETIME        NULL
);


GO

