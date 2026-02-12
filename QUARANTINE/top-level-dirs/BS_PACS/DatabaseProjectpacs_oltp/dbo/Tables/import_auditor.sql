CREATE TABLE [dbo].[import_auditor] (
    [import_id]    INT      NOT NULL,
    [status]       CHAR (1) NULL,
    [process_date] DATETIME NULL,
    [pacs_user_id] INT      NULL,
    [is_deleted]   BIT      NOT NULL,
    PRIMARY KEY CLUSTERED ([import_id] ASC)
);


GO

