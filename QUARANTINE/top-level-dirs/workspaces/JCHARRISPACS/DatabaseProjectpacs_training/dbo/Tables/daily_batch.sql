CREATE TABLE [dbo].[daily_batch] (
    [batch_id]        INT           IDENTITY (1, 1) NOT NULL,
    [batch_desc]      VARCHAR (50)  NOT NULL,
    [batch_comment]   VARCHAR (255) NULL,
    [batch_user_id]   INT           NOT NULL,
    [batch_create_dt] DATETIME      NOT NULL,
    [batch_purge_dt]  DATETIME      NULL,
    CONSTRAINT [CPK_daily_batch] PRIMARY KEY CLUSTERED ([batch_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_daily_batch_batch_user_id] FOREIGN KEY ([batch_user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id])
);


GO

