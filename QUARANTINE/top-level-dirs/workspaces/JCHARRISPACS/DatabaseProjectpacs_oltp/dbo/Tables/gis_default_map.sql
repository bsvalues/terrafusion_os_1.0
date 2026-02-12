CREATE TABLE [dbo].[gis_default_map] (
    [map_id]       INT NOT NULL,
    [pacs_user_id] INT NOT NULL,
    CONSTRAINT [CPK_gis_default_map] PRIMARY KEY CLUSTERED ([map_id] ASC)
);


GO

