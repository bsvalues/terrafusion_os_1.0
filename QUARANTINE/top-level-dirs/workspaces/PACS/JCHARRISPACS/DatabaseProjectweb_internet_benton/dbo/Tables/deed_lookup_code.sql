CREATE TABLE [dbo].[deed_lookup_code] (
    [deed_lookup_cd]      VARCHAR (10) NOT NULL,
    [deed_lookup_descr]   VARCHAR (30) NULL,
    [deed_type_cd]        VARCHAR (10) NULL,
    [county_cd]           VARCHAR (10) NULL,
    [sales_ratio_type_cd] VARCHAR (5)  NULL,
    CONSTRAINT [CPK_deed_lookup_code] PRIMARY KEY CLUSTERED ([deed_lookup_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

