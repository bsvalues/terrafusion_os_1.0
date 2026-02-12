CREATE TABLE [dbo].[monitor_tenders] (
    [pacs_user_id]     INT             NULL,
    [pacs_user_name]   VARCHAR (30)    NULL,
    [tender_type_cd]   VARCHAR (50)    NULL,
    [tender_type_desc] VARCHAR (255)   NULL,
    [amount]           NUMERIC (14, 2) NULL,
    [balance_dt]       DATETIME        NULL
);


GO

