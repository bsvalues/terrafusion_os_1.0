CREATE TABLE [dbo].[wash_appraisal_notice_format_maint] (
    [id]              INT           NOT NULL,
    [notice_year]     NUMERIC (4)   NOT NULL,
    [notice_path]     VARCHAR (255) NOT NULL,
    [expiration_date] DATETIME      NULL,
    [expiration_flag] BIT           NOT NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_format_maint] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

