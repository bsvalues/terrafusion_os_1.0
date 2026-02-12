CREATE TABLE [dbo].[prop_event_assoc] (
    [prop_id]  INT         NOT NULL,
    [event_id] INT         NOT NULL,
    [delete]   VARCHAR (1) NULL,
    CONSTRAINT [CPK_prop_event_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [event_id] ASC) WITH (FILLFACTOR = 80),
    CONSTRAINT [CFK_prop_event_assoc_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id]),
    CONSTRAINT [CFK_prop_event_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_event_id]
    ON [dbo].[prop_event_assoc]([event_id] ASC) WITH (FILLFACTOR = 80);


GO

