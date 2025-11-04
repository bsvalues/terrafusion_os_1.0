CREATE TABLE [dbo].[mh_lien_export_run] (
    [run_id]       INT         IDENTITY (1, 1) NOT NULL,
    [export_date]  DATETIME    NOT NULL,
    [pacs_user_id] INT         NOT NULL,
    [year_option]  VARCHAR (1) NOT NULL,
    CONSTRAINT [CPK_mh_lien_export_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

