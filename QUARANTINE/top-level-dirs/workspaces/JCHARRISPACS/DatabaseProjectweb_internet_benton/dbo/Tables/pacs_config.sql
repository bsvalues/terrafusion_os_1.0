CREATE TABLE [dbo].[pacs_config] (
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_pacs_config] PRIMARY KEY CLUSTERED ([szGroup] ASC, [szConfigName] ASC) WITH (FILLFACTOR = 100)
);


GO

