CREATE TABLE [dbo].[condo_characteristic_code] (
    [characteristic_cd]   VARCHAR (10) NOT NULL,
    [characteristic_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_characteristic_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC)
);


GO

