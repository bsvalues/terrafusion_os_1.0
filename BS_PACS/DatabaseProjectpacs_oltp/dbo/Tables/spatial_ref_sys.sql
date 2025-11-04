CREATE TABLE [dbo].[spatial_ref_sys] (
    [srid]      INT            NOT NULL,
    [auth_name] VARCHAR (256)  NULL,
    [auth_srid] INT            NULL,
    [srtext]    VARCHAR (2048) NULL,
    [proj4text] VARCHAR (2048) NULL,
    PRIMARY KEY CLUSTERED ([srid] ASC)
);


GO

