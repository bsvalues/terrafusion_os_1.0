CREATE TABLE [dbo].[_20240510_rbk_DO95365_tender] (
    [tender_id]                       INT             NOT NULL,
    [payment_id]                      INT             NULL,
    [tender_type_cd]                  VARCHAR (50)    NULL,
    [amount]                          NUMERIC (14, 2) NULL,
    [ref_number]                      VARCHAR (100)   NULL,
    [description]                     VARCHAR (30)    NULL,
    [dl_number]                       INT             NULL,
    [dl_state]                        VARCHAR (5)     NULL,
    [credit_amount]                   NUMERIC (14, 2) NULL,
    [credit_refund_type_cd]           VARCHAR (20)    NULL,
    [credit_refund_type_year]         NUMERIC (4)     NULL,
    [credit_interest]                 NUMERIC (14, 2) NOT NULL,
    [credit_override_refund_interest] BIT             NOT NULL
);


GO

