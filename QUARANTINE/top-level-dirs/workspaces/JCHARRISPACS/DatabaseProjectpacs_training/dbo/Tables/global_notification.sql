CREATE TABLE [dbo].[global_notification] (
    [notification_id] INT            NOT NULL,
    [title]           VARCHAR (50)   NOT NULL,
    [message]         VARCHAR (8000) NOT NULL,
    [begin_date]      DATETIME       NULL,
    [end_date]        DATETIME       NULL,
    CONSTRAINT [CPK_global_notification] PRIMARY KEY CLUSTERED ([notification_id] ASC) WITH (FILLFACTOR = 100)
);


GO

