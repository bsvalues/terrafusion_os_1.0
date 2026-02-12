CREATE TABLE [dbo].[income_level] (
    [level_cd]   VARCHAR (10) NOT NULL,
    [level_desc] CHAR (20)    NULL,
    CONSTRAINT [CPK_income_level] PRIMARY KEY CLUSTERED ([level_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

