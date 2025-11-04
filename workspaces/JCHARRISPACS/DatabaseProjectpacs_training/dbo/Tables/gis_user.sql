CREATE TABLE [dbo].[gis_user] (
    [UserSettings] VARCHAR (50) NOT NULL,
    [LastTemplate] VARCHAR (50) NULL,
    CONSTRAINT [CPK_gis_user] PRIMARY KEY CLUSTERED ([UserSettings] ASC) WITH (FILLFACTOR = 100)
);


GO

