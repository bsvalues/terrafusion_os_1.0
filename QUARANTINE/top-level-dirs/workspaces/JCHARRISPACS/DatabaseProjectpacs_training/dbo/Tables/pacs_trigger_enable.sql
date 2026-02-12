CREATE TABLE [dbo].[pacs_trigger_enable] (
    [szTableName] [sysname] NOT NULL,
    [bEnabled]    BIT       NOT NULL,
    CONSTRAINT [CPK_pacs_trigger_enable] PRIMARY KEY CLUSTERED ([szTableName] ASC) WITH (FILLFACTOR = 100)
);


GO

