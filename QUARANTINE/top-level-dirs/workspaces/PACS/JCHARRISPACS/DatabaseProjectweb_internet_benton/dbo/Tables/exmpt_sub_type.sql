CREATE TABLE [dbo].[exmpt_sub_type] (
    [exmpt_sub_type_cd]   VARCHAR (10) NOT NULL,
    [exmpt_sub_type_desc] VARCHAR (30) NOT NULL,
    [exmpt_type_cd]       VARCHAR (10) NULL,
    [disability]          BIT          NOT NULL,
    CONSTRAINT [CPK_exmpt_sub_type] PRIMARY KEY CLUSTERED ([exmpt_sub_type_cd] ASC)
);


GO

