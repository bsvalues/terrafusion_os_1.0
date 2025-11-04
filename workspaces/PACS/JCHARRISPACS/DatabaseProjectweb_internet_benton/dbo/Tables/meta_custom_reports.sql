CREATE TABLE [dbo].[meta_custom_reports] (
    [report_id]    INT           IDENTITY (1, 1) NOT NULL,
    [report_title] VARCHAR (255) NOT NULL,
    [author]       VARCHAR (255) NULL,
    [description]  VARCHAR (MAX) NULL,
    [filename]     VARCHAR (255) NOT NULL,
    [use_sql_dss]  CHAR (10)     NULL,
    [published]    CHAR (10)     NULL,
    CONSTRAINT [CPK_meta_custom_reports] PRIMARY KEY CLUSTERED ([report_id] ASC)
);


GO

