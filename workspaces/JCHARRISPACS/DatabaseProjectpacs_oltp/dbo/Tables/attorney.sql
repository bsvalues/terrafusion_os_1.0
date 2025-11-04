CREATE TABLE [dbo].[attorney] (
    [attorney_id] INT NOT NULL,
    CONSTRAINT [CPK_attorney] PRIMARY KEY CLUSTERED ([attorney_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_attorney_attorney_id] FOREIGN KEY ([attorney_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO

