CREATE TABLE [dbo].[_RBK_DO79324_bill_adjustment_20230428] (
    [bill_adj_id]                     INT             NOT NULL,
    [bill_id]                         INT             NULL,
    [transaction_id]                  INT             NULL,
    [batch_id]                        INT             NULL,
    [modify_cd]                       VARCHAR (10)    NULL,
    [modify_reason]                   VARCHAR (500)   NULL,
    [annexation_adjustment]           BIT             NULL,
    [sup_num]                         INT             NULL,
    [previous_bill_fee_cd]            VARCHAR (10)    NULL,
    [bill_fee_cd]                     VARCHAR (10)    NULL,
    [previous_effective_due_dt]       DATETIME        NULL,
    [effective_due_dt]                DATETIME        NULL,
    [previous_taxable_val]            NUMERIC (14)    NULL,
    [taxable_val]                     NUMERIC (14)    NULL,
    [bill_calc_type_cd]               VARCHAR (10)    NULL,
    [previous_base_tax]               NUMERIC (14, 2) NULL,
    [base_tax]                        NUMERIC (14, 2) NULL,
    [tax_area_id]                     INT             NULL,
    [previous_payment_status_type_cd] VARCHAR (10)    NULL,
    [payment_status_type_cd]          VARCHAR (10)    NULL,
    [adjustment_date]                 DATETIME        NULL,
    [pacs_user_id]                    INT             NULL
);


GO

