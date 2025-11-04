CREATE TABLE [dbo].[refund_transaction_assoc] (
    [refund_id]                INT             NOT NULL,
    [transaction_id]           INT             NOT NULL,
    [refund_type_cd]           VARCHAR (20)    NOT NULL,
    [year]                     NUMERIC (4)     NOT NULL,
    [sup_num]                  INT             NULL,
    [prop_id]                  INT             NULL,
    [voided]                   BIT             NULL,
    [void_transaction_id]      INT             NULL,
    [reference_id]             INT             NULL,
    [account_id]               INT             NULL,
    [override_refund_interest] BIT             CONSTRAINT [CDF_refund_transaction_assoc_override_refund_interest] DEFAULT ((0)) NOT NULL,
    [refund_interest]          NUMERIC (14, 2) CONSTRAINT [CDF_refund_transaction_assoc_refund_interest] DEFAULT ((0)) NOT NULL,
    [refund_type_year]         NUMERIC (4)     CONSTRAINT [CDF_refund_transaction_assoc_refund_type_year] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_refund_transaction_assoc] PRIMARY KEY CLUSTERED ([refund_id] ASC, [transaction_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_refund_transaction_assoc_refund_id] FOREIGN KEY ([refund_id]) REFERENCES [dbo].[refund] ([refund_id]),
    CONSTRAINT [CFK_refund_transaction_assoc_refund_type_year_refund_type_cd] FOREIGN KEY ([refund_type_year], [refund_type_cd]) REFERENCES [dbo].[refund_type] ([year], [refund_type_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The year associated with the refund type used to determine the refund interest rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'refund_transaction_assoc', @level2type = N'COLUMN', @level2name = N'refund_type_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if the user overrode the refund interest', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'refund_transaction_assoc', @level2type = N'COLUMN', @level2name = N'override_refund_interest';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The refund interest paid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'refund_transaction_assoc', @level2type = N'COLUMN', @level2name = N'refund_interest';


GO

