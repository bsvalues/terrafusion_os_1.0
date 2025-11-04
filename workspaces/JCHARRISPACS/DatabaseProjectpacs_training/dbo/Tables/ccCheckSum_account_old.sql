CREATE TABLE [dbo].[ccCheckSum_account_old] (
    [prop_id]      INT NULL,
    [acct_id]      INT NOT NULL,
    [checksum_val] INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_account_old]([prop_id] ASC, [acct_id] ASC);


GO

