CREATE TABLE [dbo].[oracle_cc_pacs_refund_status_v] (
    [invoice_num]           VARCHAR (50)    NULL,
    [pay_group_lookup_code] VARCHAR (25)    NULL,
    [invoice_date]          DATETIME        NULL,
    [invoice_amount]        NUMERIC (14, 2) NULL,
    [terms_date]            DATETIME        NULL,
    [check_to]              VARCHAR (255)   NULL,
    [check_number]          FLOAT (53)      NULL,
    [check_date]            DATETIME        NULL,
    [reference]             VARCHAR (50)    NULL,
    [amount]                FLOAT (53)      NULL,
    [status_lookup_code]    VARCHAR (25)    NULL,
    [cleared_date]          DATETIME        NULL,
    [cleared_amount]        FLOAT (53)      NULL,
    [stopped_date]          DATETIME        NULL,
    [void_date]             DATETIME        NULL,
    [last_update_date]      DATETIME        NULL
);


GO

