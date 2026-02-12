CREATE TABLE [dbo].[installment_agreement] (
    [ia_id]              INT             NOT NULL,
    [ia_acct_id]         INT             NOT NULL,
    [ia_create_user]     INT             NULL,
    [ia_create_dt]       DATETIME        NULL,
    [ia_start_dt]        DATETIME        NULL,
    [ia_ref_num]         VARCHAR (255)   NULL,
    [ia_num_months]      INT             NULL,
    [ia_payment_terms]   VARCHAR (5)     NULL,
    [ia_payment_amt]     NUMERIC (14, 2) NULL,
    [ia_status]          VARCHAR (1)     NULL,
    [ia_default_comment] VARCHAR (512)   NULL,
    [ia_default_user]    INT             NULL,
    [ia_default_dt]      DATETIME        NULL,
    [ia_sched_type]      VARCHAR (1)     NULL,
    CONSTRAINT [CPK_installment_agreement] PRIMARY KEY CLUSTERED ([ia_id] ASC) WITH (FILLFACTOR = 100)
);


GO

