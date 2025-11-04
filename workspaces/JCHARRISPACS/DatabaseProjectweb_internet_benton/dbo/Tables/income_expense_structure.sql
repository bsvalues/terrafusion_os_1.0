CREATE TABLE [dbo].[income_expense_structure] (
    [expense_structure_cd]   VARCHAR (10) NOT NULL,
    [expense_structure_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_expense_structure] PRIMARY KEY CLUSTERED ([expense_structure_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

