CREATE TABLE [dbo].[_arb_inquiry_by_account] (
    [acct_id] INT NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_by_account] PRIMARY KEY CLUSTERED ([acct_id] ASC),
    CONSTRAINT [CFK__arb_inquiry_by_account_account] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO

