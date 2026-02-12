CREATE TABLE [dbo].[pp_rendition_report_maintenance] (
    [segment] VARCHAR (50) NOT NULL,
    [type]    CHAR (10)    NOT NULL,
    CONSTRAINT [CPK_pp_rendition_report_maintenance] PRIMARY KEY CLUSTERED ([segment] ASC, [type] ASC) WITH (FILLFACTOR = 100)
);


GO

