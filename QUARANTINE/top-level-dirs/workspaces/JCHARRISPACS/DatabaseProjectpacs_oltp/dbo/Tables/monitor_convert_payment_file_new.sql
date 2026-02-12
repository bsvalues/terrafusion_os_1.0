CREATE TABLE [dbo].[monitor_convert_payment_file_new] (
    [client_id]               VARCHAR (18)  NULL,
    [client_name]             VARCHAR (47)  NULL,
    [account_number]          VARCHAR (66)  NULL,
    [amount_paid]             VARCHAR (14)  NULL,
    [process_date]            VARCHAR (12)  NULL,
    [settlement_date]         VARCHAR (12)  NULL,
    [group_id]                VARCHAR (18)  NULL,
    [group_desc]              VARCHAR (257) NULL,
    [transaction_id]          VARCHAR (13)  NULL,
    [customer_first_name]     VARCHAR (52)  NULL,
    [customer_middle_initial] VARCHAR (3)   NULL,
    [customer_last_name]      VARCHAR (52)  NULL,
    [customer_address1]       VARCHAR (37)  NULL,
    [customer_address2]       VARCHAR (37)  NULL,
    [customer_city]           VARCHAR (32)  NULL,
    [customer_state]          VARCHAR (4)   NULL,
    [customer_zip]            VARCHAR (12)  NULL
);


GO

