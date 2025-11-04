CREATE TABLE [dbo].[batch_report_criteria] (
    [pacs_user_id] INT          NOT NULL,
    [batch]        VARCHAR (50) NULL,
    [batch_user]   VARCHAR (50) NULL,
    [date_range]   VARCHAR (50) NULL,
    CONSTRAINT [CPK_batch_report_criteria] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

