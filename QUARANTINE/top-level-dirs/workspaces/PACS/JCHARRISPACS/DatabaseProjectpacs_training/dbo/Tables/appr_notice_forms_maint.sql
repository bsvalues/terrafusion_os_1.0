CREATE TABLE [dbo].[appr_notice_forms_maint] (
    [lKey]          INT          IDENTITY (1, 1) NOT NULL,
    [lNoticeYr]     NUMERIC (4)  NOT NULL,
    [szDefaultForm] VARCHAR (50) NOT NULL,
    [dtExpire]      DATETIME     NULL,
    CONSTRAINT [CPK_appr_notice_forms_maint] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 90)
);


GO

