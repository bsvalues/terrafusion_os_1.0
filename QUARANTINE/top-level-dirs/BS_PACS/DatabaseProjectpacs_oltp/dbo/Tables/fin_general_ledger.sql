CREATE TABLE [dbo].[fin_general_ledger] (
    [fin_account_id] INT             NOT NULL,
    [balance]        NUMERIC (16, 2) CONSTRAINT [CDF_fin_general_ledger_balance] DEFAULT ((0)) NOT NULL,
    [balance_date]   DATETIME        NOT NULL,
    CONSTRAINT [CPK_fin_general_ledger] PRIMARY KEY CLUSTERED ([fin_account_id] ASC, [balance_date] ASC)
);


GO

