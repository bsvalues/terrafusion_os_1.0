CREATE TABLE [dbo].[gis_settings] (
    [UserSettings]   VARCHAR (50)   NOT NULL,
    [Template]       VARCHAR (50)   NOT NULL,
    [Layer]          VARCHAR (50)   NOT NULL,
    [Name]           VARCHAR (1024) NOT NULL,
    [LayerColor]     INT            NOT NULL,
    [LayerColorName] VARCHAR (15)   NOT NULL,
    [Show]           INT            NOT NULL,
    [TreeOpen]       INT            NOT NULL,
    [Transparent]    INT            NOT NULL,
    [OutlineWidth]   INT            NOT NULL,
    [OutlineColor]   INT            NOT NULL,
    [AttribOrder]    INT            NOT NULL,
    [FontSize]       INT            NOT NULL,
    [LayerZoom]      FLOAT (53)     NOT NULL,
    [LabelVisible]   INT            NULL,
    CONSTRAINT [CPK_gis_settings] PRIMARY KEY CLUSTERED ([UserSettings] ASC, [Template] ASC, [Layer] ASC, [Name] ASC) WITH (FILLFACTOR = 100)
);


GO

