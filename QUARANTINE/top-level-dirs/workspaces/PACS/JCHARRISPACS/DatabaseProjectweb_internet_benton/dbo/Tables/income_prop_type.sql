CREATE TABLE [dbo].[income_prop_type] (
    [prop_type_cd]   VARCHAR (10) NOT NULL,
    [prop_type_desc] CHAR (20)    NULL,
    CONSTRAINT [CPK_income_prop_type] PRIMARY KEY CLUSTERED ([prop_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

