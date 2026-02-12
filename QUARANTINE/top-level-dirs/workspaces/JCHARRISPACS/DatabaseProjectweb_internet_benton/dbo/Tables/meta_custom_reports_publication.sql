CREATE TABLE [dbo].[meta_custom_reports_publication] (
    [report_id] INT          NOT NULL,
    [role_type] INT          NOT NULL,
    [role_name] VARCHAR (50) NOT NULL,
    [role_id]   INT          NOT NULL,
    CONSTRAINT [CPK_meta_custom_reports_publication] PRIMARY KEY CLUSTERED ([report_id] ASC, [role_type] ASC, [role_name] ASC, [role_id] ASC)
);


GO

