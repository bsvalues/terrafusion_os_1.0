CREATE TABLE [dbo].[TADM_CHANGE_TRACKING] (
    [changeId]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [changeDate]      DATETIME       NOT NULL,
    [tableName]       NVARCHAR (MAX) NOT NULL,
    [keyValues]       NVARCHAR (MAX) NOT NULL,
    [changeType]      NVARCHAR (1)   NOT NULL,
    [changeColumn]    NVARCHAR (MAX) NULL,
    [oldValue]        NVARCHAR (MAX) NULL,
    [newValue]        NVARCHAR (MAX) NULL,
    [description]     NVARCHAR (MAX) NULL,
    [applicationName] NVARCHAR (MAX) NULL,
    CONSTRAINT [CPK_CHANGE_TRACKING] PRIMARY KEY CLUSTERED ([changeId] ASC, [changeDate] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Table that has delete to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'tableName';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'NOT CURRENTLY USED', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'newValue';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Compare process will insert system_user associated with the job run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Compare process will the value COMPARE CHECKSUM PROCEDURE', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'applicationName';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pipe delimited values for Primary Key fields of this table to identify unique row that was deleted', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'keyValues';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'If record was inserted (I), deleted (D), or updated (U). Currently will only have Deletes.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'changeType';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Deletes for syncing with Cloud. Table is empty when there is nothing to sync. Originally tracked all changes, now ONLY deletes for certain tables identified in table ccChecksum_TrackedData with track_deletes flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique id value for each delete being tracked. Is checked against value in LastChangeId in table from SyncService.dbo.GlobalSettings for last processed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'changeId';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'NOT CURRENTLY USED', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'changeColumn';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'NOT CURRENTLY USED', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'oldValue';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Date/Time of delete', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TADM_CHANGE_TRACKING', @level2type = N'COLUMN', @level2name = N'changeDate';


GO

