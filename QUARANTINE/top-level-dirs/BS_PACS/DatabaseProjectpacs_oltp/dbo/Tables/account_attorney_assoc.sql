CREATE TABLE [dbo].[account_attorney_assoc] (
    [acct_id]     INT         NOT NULL,
    [attorney_id] INT         NOT NULL,
    [year]        NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_account_attorney_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [acct_id] ASC, [attorney_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_account_attorney_assoc_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_account_attorney_assoc_attorney_id] FOREIGN KEY ([attorney_id]) REFERENCES [dbo].[attorney] ([attorney_id])
);


GO

