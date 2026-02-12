CREATE TABLE [dbo].[gis_user_settings] (
    [UserSettings]      VARCHAR (50) NOT NULL,
    [Template]          VARCHAR (50) NOT NULL,
    [ZoomTop]           FLOAT (53)   NOT NULL,
    [ZoomLeft]          FLOAT (53)   NOT NULL,
    [ZoomBottom]        FLOAT (53)   NOT NULL,
    [ZoomRight]         FLOAT (53)   NOT NULL,
    [GlobalTemplate]    INT          NOT NULL,
    [ShowDetailedLabel] BIT          CONSTRAINT [CDF_gis_user_settings_ShowDetailedLabel] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_gis_user_settings] PRIMARY KEY CLUSTERED ([UserSettings] ASC, [Template] ASC) WITH (FILLFACTOR = 100)
);


GO

