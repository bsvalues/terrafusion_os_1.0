CREATE TABLE [dbo].[income_class] (
    [class_cd]   VARCHAR (10) NOT NULL,
    [class_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_class] PRIMARY KEY CLUSTERED ([class_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

