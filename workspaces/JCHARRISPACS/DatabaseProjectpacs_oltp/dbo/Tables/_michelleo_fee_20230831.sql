CREATE TABLE [dbo].[_michelleo_fee_20230831] (
    [fee_id]                 INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [fee_type_cd]            VARCHAR (10)    NULL,
    [owner_id]               INT             NULL,
    [statement_id]           INT             NULL,
    [initial_amount_due]     NUMERIC (14, 2) NULL,
    [current_amount_due]     NUMERIC (14, 2) NULL,
    [amount_paid]            NUMERIC (14, 2) NOT NULL,
    [amount_due_override]    BIT             NULL,
    [effective_due_date]     DATETIME        NULL,
    [comment]                VARCHAR (255)   NULL,
    [fee_create_date]        DATETIME        NULL,
    [last_modified]          DATETIME        NULL,
    [code]                   VARCHAR (10)    NULL,
    [payment_status_type_cd] VARCHAR (10)    NULL,
    [payout_agreement_id]    INT             NULL,
    [sup_num]                INT             NULL,
    [rollback_id]            INT             NULL,
    [is_active]              BIT             NOT NULL,
    [payment_group_id]       INT             NULL,
    [display_year]           NUMERIC (5)     NULL,
    [cnv_xref]               VARCHAR (50)    NULL,
    [is_overpaid]            BIT             NULL,
    [misc_rcpt_cd]           VARCHAR (10)    NULL
);


GO

