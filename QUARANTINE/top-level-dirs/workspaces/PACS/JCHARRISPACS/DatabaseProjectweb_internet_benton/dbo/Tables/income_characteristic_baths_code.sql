CREATE TABLE [dbo].[income_characteristic_baths_code] (
    [baths_cd]   VARCHAR (5)  NOT NULL,
    [baths_desc] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_income_characteristic_baths_code] PRIMARY KEY CLUSTERED ([baths_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

