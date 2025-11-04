CREATE TABLE [dbo].[assessment_type] (
    [assessment_type_cd] VARCHAR (50) NOT NULL,
    [assessment_desc]    VARCHAR (50) NOT NULL,
    [sys_flag]           BIT          NOT NULL,
    CONSTRAINT [CPK_assessment_type] PRIMARY KEY CLUSTERED ([assessment_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

