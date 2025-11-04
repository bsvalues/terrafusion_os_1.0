CREATE TABLE [dbo].[fin_transaction] (
    [fin_transaction_id]      INT             NOT NULL,
    [fin_account_id]          INT             NOT NULL,
    [transaction_date]        DATETIME        NOT NULL,
    [debit_amount]            NUMERIC (14, 2) NULL,
    [credit_amount]           NUMERIC (14, 2) NULL,
    [export_date]             DATETIME        NULL,
    [description]             VARCHAR (100)   NULL,
    [reference_id]            VARCHAR (50)    NULL,
    [create_process]          VARCHAR (50)    NULL,
    [create_process_id]       INT             NULL,
    [create_date]             DATETIME        CONSTRAINT [CDF_fin_transaction_create_date] DEFAULT (getdate()) NOT NULL,
    [fin_event_cd]            VARCHAR (15)    NOT NULL,
    [fin_transaction_type_cd] VARCHAR (10)    NULL,
    [additional_description]  VARCHAR (100)   NULL,
    [comment]                 VARCHAR (240)   NULL,
    CONSTRAINT [CPK_fin_transaction] PRIMARY KEY CLUSTERED ([fin_transaction_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_fin_transaction_debit_amount_credit_amount] CHECK ([debit_amount] IS NULL AND [credit_amount] IS NOT NULL OR [debit_amount] IS NOT NULL AND [credit_amount] IS NULL),
    CONSTRAINT [CFK_fin_transaction_fin_event_cd] FOREIGN KEY ([fin_event_cd]) REFERENCES [dbo].[fin_event_code] ([event_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_create_process_id]
    ON [dbo].[fin_transaction]([create_process_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_FinTransactions_AccountAndDate]
    ON [dbo].[fin_transaction]([fin_account_id] ASC, [transaction_date] DESC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Provides additional information storage required for certain distribution exports', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_transaction', @level2type = N'COLUMN', @level2name = N'additional_description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Long comment for GL_INTERFACE.LINE_DESCRIPTION', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_transaction', @level2type = N'COLUMN', @level2name = N'comment';


GO

