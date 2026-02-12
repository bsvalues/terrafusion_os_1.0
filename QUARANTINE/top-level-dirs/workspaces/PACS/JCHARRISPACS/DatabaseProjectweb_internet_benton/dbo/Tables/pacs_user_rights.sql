CREATE TABLE [dbo].[pacs_user_rights] (
    [pacs_user_id]         INT      NOT NULL,
    [pacs_user_right_id]   INT      NOT NULL,
    [pacs_user_right_type] CHAR (1) NOT NULL,
    CONSTRAINT [CPK_pacs_user_rights] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [pacs_user_right_id] ASC, [pacs_user_right_type] ASC) WITH (FILLFACTOR = 100)
);


GO

