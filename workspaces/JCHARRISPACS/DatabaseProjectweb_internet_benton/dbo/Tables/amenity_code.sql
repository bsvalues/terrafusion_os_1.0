CREATE TABLE [dbo].[amenity_code] (
    [amenity_cd]   VARCHAR (10) NOT NULL,
    [amenity_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_amenity_code] PRIMARY KEY CLUSTERED ([amenity_cd] ASC)
);


GO

