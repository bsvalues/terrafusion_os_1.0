CREATE TABLE [dbo].[litigation_fee] (
    [litigation_fee_id]   INT             NOT NULL,
    [litigation_id]       INT             NOT NULL,
    [year]                NUMERIC (4)     NOT NULL,
    [create_date]         DATETIME        NOT NULL,
    [batch_id]            INT             NOT NULL,
    [fee_type_cd]         VARCHAR (50)    NULL,
    [amount]              NUMERIC (14, 2) NULL,
    [effective_due_date]  DATETIME        NULL,
    [comment]             VARCHAR (255)   NULL,
    [pacs_user_id]        INT             NULL,
    [amount_due_override] BIT             NULL,
    CONSTRAINT [CPK_litigation_fee] PRIMARY KEY CLUSTERED ([litigation_fee_id] ASC)
);


GO

