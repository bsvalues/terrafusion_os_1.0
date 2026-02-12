CREATE TABLE [dbo].[owner_links] (
    [main_owner_id]  INT NOT NULL,
    [child_owner_id] INT NOT NULL,
    CONSTRAINT [CPK_owner_links] PRIMARY KEY CLUSTERED ([main_owner_id] ASC, [child_owner_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_owner_links_child_owner_id] FOREIGN KEY ([child_owner_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_owner_links_main_owner_id] FOREIGN KEY ([main_owner_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO

