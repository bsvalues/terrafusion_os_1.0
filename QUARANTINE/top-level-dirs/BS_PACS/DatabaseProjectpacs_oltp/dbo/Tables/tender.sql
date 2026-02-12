CREATE TABLE [dbo].[tender] (
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
    [credit_interest]                 NUMERIC (14, 2) CONSTRAINT [CDF_tender_credit_interest] DEFAULT ((0)) NOT NULL,
    [credit_override_refund_interest] BIT             CONSTRAINT [CDF_tender_credit_override_refund_interest] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_tender] PRIMARY KEY CLUSTERED ([tender_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_tender_payment_id] FOREIGN KEY ([payment_id]) REFERENCES [dbo].[payment] ([payment_id]),
    CONSTRAINT [cfk_tender_refund_type] FOREIGN KEY ([credit_refund_type_year], [credit_refund_type_cd]) REFERENCES [dbo].[refund_type] ([year], [refund_type_cd]),
    CONSTRAINT [CFK_tender_tender_type_cd] FOREIGN KEY ([tender_type_cd]) REFERENCES [dbo].[tender_type] ([tender_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_payment_id]
    ON [dbo].[tender]([payment_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This is the refund type code of applied adjustment credit tenders.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tender', @level2type = N'COLUMN', @level2name = N'credit_refund_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This is the refund type year of applied adjustment credit tenders.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tender', @level2type = N'COLUMN', @level2name = N'credit_refund_type_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This is the refund interest amount of applied adjustment credit tenders.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tender', @level2type = N'COLUMN', @level2name = N'credit_interest';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This is the refund interest amount override flag for applied adjustment credit tenders.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tender', @level2type = N'COLUMN', @level2name = N'credit_override_refund_interest';


GO

