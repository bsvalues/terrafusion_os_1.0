CREATE TABLE [dbo].[ccUpSyncQueue] (
    [prop_id] INT NOT NULL,
    [isNew]   BIT NULL,
    [run_id]  INT NULL,
    CONSTRAINT [CPK_ccUpSyncQueue] PRIMARY KEY CLUSTERED ([prop_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The run id that this entry was created. Related to ccCheckSum_Compare_RunInfo table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUpSyncQueue', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator is set to 1 if this property id is being inserted into the ccProperty table during the compare job run. Indicates new to cloud', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUpSyncQueue', @level2type = N'COLUMN', @level2name = N'isNew';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Property related Changes for syncing with Cloud. Table is empty when there is nothing to sync', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUpSyncQueue';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Id value of the property with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUpSyncQueue', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

