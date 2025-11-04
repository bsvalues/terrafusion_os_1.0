CREATE TABLE [dbo].[supplement_type] (
    [sup_type_cd]    CHAR (10)    NOT NULL,
    [sup_type_desc]  VARCHAR (50) NULL,
    [sys_flag]       VARCHAR (1)  NULL,
    [supp_attribute] INT          NULL,
    CONSTRAINT [CPK_supplement_type] PRIMARY KEY CLUSTERED ([sup_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

