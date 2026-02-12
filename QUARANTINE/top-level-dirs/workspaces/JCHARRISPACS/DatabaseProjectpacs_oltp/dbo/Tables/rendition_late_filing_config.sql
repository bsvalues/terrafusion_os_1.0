CREATE TABLE [dbo].[rendition_late_filing_config] (
    [year]                   NUMERIC (4)     NOT NULL,
    [late_date]              DATETIME        NOT NULL,
    [notice_penalty_percent] NUMERIC (14, 2) NOT NULL,
    CONSTRAINT [CPK_rendition_late_filing_config] PRIMARY KEY CLUSTERED ([year] ASC)
);


GO

