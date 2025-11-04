CREATE TABLE [dbo].[month_to_date_recap_date_range] (
    [pacs_user_id] INT      NOT NULL,
    [entity_id]    INT      NOT NULL,
    [begin_dt]     DATETIME NULL,
    [end_dt]       DATETIME NULL,
    CONSTRAINT [CPK_month_to_date_recap_date_range] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

