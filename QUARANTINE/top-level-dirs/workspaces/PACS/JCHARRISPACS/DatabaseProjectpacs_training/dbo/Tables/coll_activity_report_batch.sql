CREATE TABLE [dbo].[coll_activity_report_batch] (
    [pacs_user_id] INT           NOT NULL,
    [batch]        VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_coll_activity_report_batch] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [batch] ASC) WITH (FILLFACTOR = 100)
);


GO

