CREATE TABLE [dbo].[config_licenses] (
    [Module]   VARCHAR (20) NOT NULL,
    [Licenses] INT          NULL,
    CONSTRAINT [CPK_config_licenses] PRIMARY KEY CLUSTERED ([Module] ASC) WITH (FILLFACTOR = 100)
);


GO

