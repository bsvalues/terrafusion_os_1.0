CREATE TABLE [dbo].[assessment_use_category] (
    [assessment_use_cd]   VARCHAR (10)  NOT NULL,
    [assessment_use_desc] VARCHAR (200) NOT NULL,
    [sys_flag]            BIT           NULL,
    CONSTRAINT [CPK_assessment_use_category] PRIMARY KEY CLUSTERED ([assessment_use_cd] ASC)
);


GO

