CREATE TABLE [dbo].[gis_property_attributes] (
    [DisplayOrder]  INT          NOT NULL,
    [Name]          VARCHAR (25) NOT NULL,
    [Field]         VARCHAR (25) NOT NULL,
    [Label]         VARCHAR (25) NULL,
    [DefaultShow]   INT          NOT NULL,
    [ShowCompSales] INT          NOT NULL,
    CONSTRAINT [CPK_gis_property_attributes] PRIMARY KEY CLUSTERED ([Name] ASC, [DisplayOrder] ASC) WITH (FILLFACTOR = 100)
);


GO

