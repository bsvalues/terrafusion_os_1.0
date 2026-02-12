CREATE TABLE [dbo].[gis_user_layer_order] (
    [UserSetting] VARCHAR (50) NOT NULL,
    [Template]    VARCHAR (50) NOT NULL,
    [Layer]       VARCHAR (50) NOT NULL,
    [LayerOrder]  INT          NOT NULL,
    CONSTRAINT [CPK_gis_user_layer_order] PRIMARY KEY CLUSTERED ([UserSetting] ASC, [Template] ASC, [Layer] ASC) WITH (FILLFACTOR = 100)
);


GO

