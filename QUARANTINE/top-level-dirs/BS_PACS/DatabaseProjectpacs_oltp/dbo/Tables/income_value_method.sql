CREATE TABLE [dbo].[income_value_method] (
    [value_method_cd]   VARCHAR (5)  NOT NULL,
    [value_method_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_income_value_method] PRIMARY KEY CLUSTERED ([value_method_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

