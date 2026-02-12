CREATE TABLE [dbo].[coll_activity_report_criteria] (
    [pacs_user_id] INT           NOT NULL,
    [batch]        VARCHAR (255) NULL,
    [entity]       VARCHAR (50)  NOT NULL,
    [coll_year]    VARCHAR (4)   NULL,
    [date_range]   VARCHAR (50)  NULL,
    CONSTRAINT [CPK_coll_activity_report_criteria] PRIMARY KEY NONCLUSTERED ([pacs_user_id] ASC, [entity] ASC) WITH (FILLFACTOR = 90)
);


GO

