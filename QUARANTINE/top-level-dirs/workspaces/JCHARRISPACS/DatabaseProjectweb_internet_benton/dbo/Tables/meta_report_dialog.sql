CREATE TABLE [dbo].[meta_report_dialog] (
    [dialog_id]   INT           IDENTITY (1, 1) NOT NULL,
    [name]        VARCHAR (255) NOT NULL,
    [dialog]      VARCHAR (255) NOT NULL,
    [description] VARCHAR (255) NULL,
    [report_name] VARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_report_dialog] PRIMARY KEY CLUSTERED ([dialog_id] ASC, [name] ASC) WITH (FILLFACTOR = 100)
);


GO

