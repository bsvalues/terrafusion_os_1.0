CREATE TABLE [dbo].[account_event_assoc] (
    [acct_id]  INT NOT NULL,
    [event_id] INT NOT NULL,
    CONSTRAINT [CPK_account_event_assoc] PRIMARY KEY CLUSTERED ([acct_id] ASC, [event_id] ASC) WITH (FILLFACTOR = 90)
);


GO

