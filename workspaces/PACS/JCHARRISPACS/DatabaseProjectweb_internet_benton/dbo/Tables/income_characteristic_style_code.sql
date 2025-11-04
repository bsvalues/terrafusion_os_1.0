CREATE TABLE [dbo].[income_characteristic_style_code] (
    [style_cd]   VARCHAR (20) NOT NULL,
    [style_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_income_characteristic_style_code] PRIMARY KEY CLUSTERED ([style_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

