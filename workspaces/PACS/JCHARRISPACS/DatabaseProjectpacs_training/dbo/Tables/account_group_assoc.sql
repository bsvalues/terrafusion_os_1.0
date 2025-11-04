CREATE TABLE [dbo].[account_group_assoc] (
    [acct_id]  INT          NOT NULL,
    [group_cd] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_account_group_assoc] PRIMARY KEY CLUSTERED ([acct_id] ASC, [group_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_account_group_assoc_group_cd] FOREIGN KEY ([group_cd]) REFERENCES [dbo].[account_group_code] ([group_cd])
);


GO

