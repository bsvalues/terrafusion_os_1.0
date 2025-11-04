CREATE TABLE [dbo].[condo_material_code] (
    [material_cd]   VARCHAR (10) NOT NULL,
    [material_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_material_code] PRIMARY KEY CLUSTERED ([material_cd] ASC)
);


GO

