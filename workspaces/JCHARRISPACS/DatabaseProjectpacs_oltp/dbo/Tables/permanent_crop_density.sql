CREATE TABLE [dbo].[permanent_crop_density] (
    [density_cd]   VARCHAR (15) NOT NULL,
    [density_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_permanent_crop_density] PRIMARY KEY CLUSTERED ([density_cd] ASC)
);


GO

