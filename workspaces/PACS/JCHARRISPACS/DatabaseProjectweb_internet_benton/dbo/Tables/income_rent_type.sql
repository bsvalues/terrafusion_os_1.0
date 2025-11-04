CREATE TABLE [dbo].[income_rent_type] (
    [rent_type_cd]   VARCHAR (10) NOT NULL,
    [rent_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_rent_type] PRIMARY KEY CLUSTERED ([rent_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

