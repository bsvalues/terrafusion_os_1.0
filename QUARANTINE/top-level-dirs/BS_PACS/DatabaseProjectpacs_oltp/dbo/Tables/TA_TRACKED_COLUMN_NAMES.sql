CREATE TABLE [dbo].[TA_TRACKED_COLUMN_NAMES] (
    [column_name] [sysname] NOT NULL,
    CONSTRAINT [CPK_TA_TRACKED_COLUMN_NAMES] PRIMARY KEY CLUSTERED ([column_name] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile columns tracked to detemined changed records that need syncing with Cloud.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TA_TRACKED_COLUMN_NAMES';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Column name to be tracked', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TA_TRACKED_COLUMN_NAMES', @level2type = N'COLUMN', @level2name = N'column_name';


GO

