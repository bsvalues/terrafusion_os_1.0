CREATE TABLE [dbo].[income_lease_type] (
    [lease_type_cd]   VARCHAR (10) NOT NULL,
    [lease_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_lease_type] PRIMARY KEY CLUSTERED ([lease_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

