CREATE TABLE [dbo].[_rbk_tax_due_calc_bill] (
    [dataset_id]             INT             NOT NULL,
    [bill_id]                INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [sup_num]                INT             NOT NULL,
    [prop_id]                INT             NOT NULL,
    [initial_amount_due]     NUMERIC (14, 2) NOT NULL,
    [current_amount_due]     NUMERIC (14, 2) NOT NULL,
    [amount_paid]            NUMERIC (14, 2) NOT NULL,
    [is_active]              BIT             NOT NULL,
    [bill_type]              VARCHAR (5)     NULL,
    [effective_due_date]     DATETIME        NULL,
    [statement_id]           INT             NULL,
    [payment_status_type_cd] VARCHAR (10)    NULL
);


GO

