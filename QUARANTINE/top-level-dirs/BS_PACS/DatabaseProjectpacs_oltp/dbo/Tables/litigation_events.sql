CREATE TABLE [dbo].[litigation_events] (
    [litigation_event_id] INT           NOT NULL,
    [litigation_id]       INT           NOT NULL,
    [event_cd]            VARCHAR (10)  NOT NULL,
    [event_dt]            DATETIME      NOT NULL,
    [pacs_user_id]        INT           NOT NULL,
    [recheck_dt]          DATETIME      NULL,
    [recheck_complete]    BIT           DEFAULT ((0)) NOT NULL,
    [event_description]   VARCHAR (255) NULL,
    CONSTRAINT [CPK_litigation_events] PRIMARY KEY CLUSTERED ([litigation_event_id] ASC),
    CONSTRAINT [CFK_litigation_events_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id]),
    CONSTRAINT [CFK_litigation_events_litigation_event_type] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[litigation_event_type] ([litigation_event_cd])
);


GO

