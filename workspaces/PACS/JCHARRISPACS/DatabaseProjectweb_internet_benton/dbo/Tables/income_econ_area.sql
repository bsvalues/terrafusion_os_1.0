CREATE TABLE [dbo].[income_econ_area] (
    [econ_cd]   VARCHAR (10) NOT NULL,
    [econ_desc] CHAR (20)    NULL,
    CONSTRAINT [CPK_income_econ_area] PRIMARY KEY CLUSTERED ([econ_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

