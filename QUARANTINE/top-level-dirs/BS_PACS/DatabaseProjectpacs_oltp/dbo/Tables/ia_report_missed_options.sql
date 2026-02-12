CREATE TABLE [dbo].[ia_report_missed_options] (
    [date_missed_since] DATETIME NOT NULL,
    CONSTRAINT [CPK_ia_report_missed_options] PRIMARY KEY CLUSTERED ([date_missed_since] ASC) WITH (FILLFACTOR = 100)
);


GO

