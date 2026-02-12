CREATE TABLE [dbo].[pacs_upgrades] (
    [upgrade_id]   INT           IDENTITY (1, 1) NOT NULL,
    [upgrade_dt]   DATETIME      CONSTRAINT [CDF_pacs_upgrades_upgrade_dt] DEFAULT (getdate()) NOT NULL,
    [upgrade_desc] VARCHAR (255) NULL,
    CONSTRAINT [CPK_pacs_upgrades] PRIMARY KEY CLUSTERED ([upgrade_id] ASC) WITH (FILLFACTOR = 100)
);


GO

