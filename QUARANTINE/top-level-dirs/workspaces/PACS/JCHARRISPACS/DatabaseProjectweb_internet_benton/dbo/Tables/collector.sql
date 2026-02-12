CREATE TABLE [dbo].[collector] (
    [collector_id] INT NOT NULL,
    CONSTRAINT [CPK_collector] PRIMARY KEY CLUSTERED ([collector_id] ASC) WITH (FILLFACTOR = 90)
);


GO

