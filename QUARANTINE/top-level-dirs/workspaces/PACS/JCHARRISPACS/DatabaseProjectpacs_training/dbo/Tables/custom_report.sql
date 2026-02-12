CREATE TABLE [dbo].[custom_report] (
    [report_id] INT           IDENTITY (1, 1) NOT NULL,
    [name]      VARCHAR (50)  NOT NULL,
    [filename]  VARCHAR (50)  NOT NULL,
    [path]      VARCHAR (500) NULL,
    CONSTRAINT [CPK_custom_report] PRIMARY KEY CLUSTERED ([report_id] ASC)
);


GO

