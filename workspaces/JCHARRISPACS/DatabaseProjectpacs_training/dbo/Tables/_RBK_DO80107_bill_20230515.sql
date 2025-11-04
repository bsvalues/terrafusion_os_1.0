CREATE TABLE [dbo].[_RBK_DO80107_bill_20230515] (
    [bill_id]                  INT             NOT NULL,
    [prop_id]                  INT             NULL,
    [year]                     NUMERIC (4)     NULL,
    [sup_num]                  INT             NULL,
    [owner_id]                 INT             NULL,
    [initial_amount_due]       NUMERIC (14, 2) NULL,
    [current_amount_due]       NUMERIC (14, 2) NULL,
    [amount_paid]              NUMERIC (14, 2) NULL,
    [bill_type]                VARCHAR (5)     NULL,
    [effective_due_date]       DATETIME        NULL,
    [earliest_collection_date] DATETIME        NULL,
    [statement_id]             INT             NULL,
    [code]                     VARCHAR (10)    NULL,
    [is_active]                BIT             NOT NULL,
    [last_modified]            DATETIME        NULL,
    [adj_effective_dt]         DATETIME        NULL,
    [adj_expiration_dt]        DATETIME        NULL,
    [comment]                  VARCHAR (500)   NULL,
    [payment_status_type_cd]   VARCHAR (10)    NULL,
    [created_by_type_cd]       VARCHAR (10)    NULL,
    [rollback_id]              INT             NULL,
    [payment_group_id]         INT             NULL,
    [display_year]             NUMERIC (5)     NULL,
    [cnv_xref]                 VARCHAR (50)    NULL,
    [is_overpaid]              BIT             NULL
);


GO

