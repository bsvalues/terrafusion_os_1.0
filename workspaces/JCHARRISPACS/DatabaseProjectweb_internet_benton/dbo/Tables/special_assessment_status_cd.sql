CREATE TABLE [dbo].[special_assessment_status_cd] (
    [status_cd]   VARCHAR (10) NOT NULL,
    [status_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_special_assessment_status_cd] PRIMARY KEY CLUSTERED ([status_cd] ASC)
);


GO

