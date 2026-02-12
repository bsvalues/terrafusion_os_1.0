CREATE TABLE [dbo].[year_to_date_recap_range] (
    [pacs_user_id] INT      NOT NULL,
    [entity_id]    INT      NOT NULL,
    [date_range]   DATETIME NULL,
    CONSTRAINT [CPK_year_to_date_recap_range] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

