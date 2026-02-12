CREATE TABLE [dbo].[gis_attributes] (
    [Layer]         VARCHAR (1024) NOT NULL,
    [DisplayOrder]  INT            NOT NULL,
    [Name]          VARCHAR (25)   NOT NULL,
    [Field]         VARCHAR (25)   NOT NULL,
    [Label]         VARCHAR (25)   NULL,
    [Visible]       INT            NOT NULL,
    [ShowCompSales] INT            NOT NULL,
    CONSTRAINT [CPK_gis_attributes] PRIMARY KEY CLUSTERED ([Layer] ASC, [DisplayOrder] ASC) WITH (FILLFACTOR = 100)
);


GO

