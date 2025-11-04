CREATE TABLE [dbo].[gis_user_default_map] (
    [pacs_user_id] INT NOT NULL,
    [map_id]       INT NOT NULL,
    CONSTRAINT [CPK_gis_user_default_map] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC)
);


GO

