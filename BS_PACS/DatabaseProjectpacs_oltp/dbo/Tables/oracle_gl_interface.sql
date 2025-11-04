CREATE TABLE [dbo].[oracle_gl_interface] (
    [status]                   VARCHAR (50)    NULL,
    [set_of_books_id]          NUMERIC (15)    NULL,
    [accounting_date]          DATETIME        NULL,
    [currency_code]            VARCHAR (15)    NULL,
    [date_created]             DATETIME        NULL,
    [created_by]               NUMERIC (15)    NULL,
    [actual_flag]              VARCHAR (1)     NULL,
    [user_je_category_name]    VARCHAR (25)    NULL,
    [user_je_source_name]      VARCHAR (25)    NULL,
    [average_journal_flag]     VARCHAR (1)     NULL,
    [segment1]                 VARCHAR (25)    NULL,
    [segment2]                 VARCHAR (25)    NULL,
    [segment3]                 VARCHAR (25)    NULL,
    [segment4]                 VARCHAR (25)    NULL,
    [segment5]                 VARCHAR (25)    NULL,
    [segment6]                 VARCHAR (25)    NULL,
    [entered_dr]               NUMERIC (14, 2) NULL,
    [entered_cr]               NUMERIC (14, 2) NULL,
    [reference1]               VARCHAR (100)   NULL,
    [reference4]               VARCHAR (100)   NULL,
    [reference5]               VARCHAR (240)   NULL,
    [reference10]              VARCHAR (240)   NULL,
    [status_description]       VARCHAR (240)   NULL,
    [stat_amount]              FLOAT (53)      NULL,
    [group_id]                 NUMERIC (15)    NULL,
    [context2]                 VARCHAR (150)   NULL,
    [ussgl_transaction_code]   VARCHAR (30)    NULL,
    [descr_flex_error_message] VARCHAR (240)   NULL,
    [exported]                 BIT             NULL,
    [segment7]                 VARCHAR (25)    NULL,
    [segment8]                 VARCHAR (25)    NULL
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'segment8', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'oracle_gl_interface', @level2type = N'COLUMN', @level2name = N'segment8';


GO

