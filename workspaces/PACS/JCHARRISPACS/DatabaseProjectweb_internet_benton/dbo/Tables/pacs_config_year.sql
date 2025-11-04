CREATE TABLE [dbo].[pacs_config_year] (
    [year]          NUMERIC (4)   NOT NULL,
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_pacs_config_year] PRIMARY KEY CLUSTERED ([year] ASC, [szGroup] ASC, [szConfigName] ASC)
);


GO

