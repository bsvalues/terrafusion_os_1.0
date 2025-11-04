CREATE TABLE [dbo].[_rbk_fee_adj_20230508] (
    [fee_adj_id]                      INT             NOT NULL,
    [fee_id]                          INT             NULL,
    [transaction_id]                  INT             NULL,
    [modify_cd]                       VARCHAR (10)    NULL,
    [modify_reason]                   VARCHAR (500)   NULL,
    [sup_num]                         INT             NULL,
    [previous_bill_fee_cd]            VARCHAR (10)    NULL,
    [bill_fee_cd]                     VARCHAR (10)    NULL,
    [previous_effective_due_dt]       DATETIME        NULL,
    [effective_due_dt]                DATETIME        NULL,
    [bill_calc_type_cd]               VARCHAR (10)    NULL,
    [previous_base_amount]            NUMERIC (14, 2) NULL,
    [base_amount]                     NUMERIC (14, 2) NULL,
    [batch_id]                        INT             NULL,
    [previous_payment_status_type_cd] VARCHAR (10)    NULL,
    [payment_status_type_cd]          VARCHAR (10)    NULL,
    [adjustment_date]                 DATETIME        NULL,
    [pacs_user_id]                    INT             NULL
);


GO

