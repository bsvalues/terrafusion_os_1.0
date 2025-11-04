CREATE TABLE [dbo].[sup_group] (
    [sup_group_id]            INT           NOT NULL,
    [sup_group_desc]          VARCHAR (50)  NULL,
    [sup_create_dt]           DATETIME      NULL,
    [sup_arb_ready_dt]        DATETIME      NULL,
    [sup_accept_dt]           DATETIME      NULL,
    [sup_bill_create_dt]      DATETIME      NULL,
    [status_cd]               CHAR (5)      NULL,
    [sup_accept_by_id]        INT           NULL,
    [sup_bills_created_by_id] INT           NULL,
    [sup_group_comment]       VARCHAR (255) NULL,
    [sup_bill_status]         VARCHAR (5)   NULL,
    [sup_bills_batch_id]      INT           NULL,
    CONSTRAINT [CPK_sup_group] PRIMARY KEY CLUSTERED ([sup_group_id] ASC) WITH (FILLFACTOR = 90)
);


GO

