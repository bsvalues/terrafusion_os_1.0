CREATE TABLE [dbo].[fee_acct_assoc] (
    [fee_id]  INT NOT NULL,
    [acct_id] INT NOT NULL,
    CONSTRAINT [CPK_fee_acct_assoc] PRIMARY KEY CLUSTERED ([fee_id] ASC, [acct_id] ASC) WITH (FILLFACTOR = 90)
);


GO

