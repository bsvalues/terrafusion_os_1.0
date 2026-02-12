CREATE TABLE [dbo].[reet_event_assoc] (
    [event_id] INT NOT NULL,
    [reet_id]  INT NOT NULL,
    CONSTRAINT [CPK_reet_event_assoc] PRIMARY KEY CLUSTERED ([event_id] ASC, [reet_id] ASC),
    CONSTRAINT [CFK_reet_event_assoc_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id]),
    CONSTRAINT [CFK_reet_event_assoc_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

