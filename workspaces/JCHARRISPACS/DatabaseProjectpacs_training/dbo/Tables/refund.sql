CREATE TABLE [dbo].[refund] (
    [refund_id]            INT             NOT NULL,
    [batch_id]             INT             NULL,
    [check_number]         VARCHAR (50)    NULL,
    [refund_amount]        NUMERIC (14, 2) NULL,
    [refund_date]          DATETIME        NULL,
    [account_id]           INT             NULL,
    [status]               VARCHAR (50)    NULL,
    [voided_by_id]         INT             NULL,
    [voided_date]          DATETIME        NULL,
    [refund_to_name]       VARCHAR (70)    NULL,
    [refund_to_address1]   VARCHAR (60)    NULL,
    [refund_to_address2]   VARCHAR (60)    NULL,
    [refund_to_address3]   VARCHAR (60)    NULL,
    [refund_to_city]       VARCHAR (50)    NULL,
    [refund_to_state]      VARCHAR (50)    NULL,
    [refund_to_zip]        VARCHAR (10)    NULL,
    [refund_to_country_cd] VARCHAR (10)    NULL,
    [operator_id]          INT             NULL,
    [voided]               BIT             NOT NULL,
    [voided_reason]        VARCHAR (255)   NULL,
    [voided_batch_id]      INT             NULL,
    [orig_refund_id]       INT             NULL,
    CONSTRAINT [CPK_refund] PRIMARY KEY CLUSTERED ([refund_id] ASC) WITH (FILLFACTOR = 100)
);


GO

