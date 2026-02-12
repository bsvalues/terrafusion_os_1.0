CREATE TABLE [dbo].[levy_limit_type] (
    [levy_limit_type_cd]   VARCHAR (10) NOT NULL,
    [levy_limit_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_levy_limit_type] PRIMARY KEY CLUSTERED ([levy_limit_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

