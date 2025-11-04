CREATE TABLE [dbo].[replication_subscription_dropped] (
    [szTableName]        [sysname]    NOT NULL,
    [szDestServer]       [sysname]    NOT NULL,
    [szDestDB]           [sysname]    NOT NULL,
    [szDistServer]       [sysname]    NULL,
    [publication_prefix] VARCHAR (20) NULL
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This field contains the name of the table that had a publication dropped', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'replication_subscription_dropped', @level2type = N'COLUMN', @level2name = N'szTableName';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This field contains the name of the distribution server', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'replication_subscription_dropped', @level2type = N'COLUMN', @level2name = N'szDistServer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains information for rebuilding PACS supported replication for tables that had replication dropped - normally during an upgrade process. Upgrade process will read this table at the end of an upgrade and rebuild dropped publications.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'replication_subscription_dropped';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This field contains the name of the destination database for the publication dropped', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'replication_subscription_dropped', @level2type = N'COLUMN', @level2name = N'szDestDB';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This field contains the name of the destination server for the publication dropped', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'replication_subscription_dropped', @level2type = N'COLUMN', @level2name = N'szDestServer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This field contains the valid PACS supported prefix of the publication dropped', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'replication_subscription_dropped', @level2type = N'COLUMN', @level2name = N'publication_prefix';


GO

