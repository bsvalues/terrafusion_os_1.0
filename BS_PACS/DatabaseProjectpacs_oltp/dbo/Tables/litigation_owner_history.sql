CREATE TABLE [dbo].[litigation_owner_history] (
    [litigation_id] INT      NOT NULL,
    [owner_id]      INT      NOT NULL,
    [date_added]    DATETIME NOT NULL,
    [date_removed]  DATETIME NULL,
    CONSTRAINT [CPK_litigation_owner_history] PRIMARY KEY CLUSTERED ([litigation_id] ASC, [owner_id] ASC, [date_added] ASC),
    CONSTRAINT [CFK_litigation_owner_history_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id])
);


GO

