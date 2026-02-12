CREATE TABLE [dbo].[ccImageUpSyncQueue] (
    [prop_id]         INT           NOT NULL,
    [image_path]      VARCHAR (255) CONSTRAINT [CDF_ccImageUpSyncQueue_image_path] DEFAULT ('') NOT NULL,
    [main_image_flag] BIT           NULL,
    [run_id]          INT           NULL,
    CONSTRAINT [CPK_ccImageUpSyncQueue] PRIMARY KEY CLUSTERED ([prop_id] ASC, [image_path] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The run id that this entry was created. Related to ccCheckSum_Compare_RunInfo table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccImageUpSyncQueue', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Full path file location of image to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccImageUpSyncQueue', @level2type = N'COLUMN', @level2name = N'image_path';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Image Changes for syncing with Cloud. Table is empty when there is nothing to sync', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccImageUpSyncQueue';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Value of 1 if this is the main image for the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccImageUpSyncQueue', @level2type = N'COLUMN', @level2name = N'main_image_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Id value of the property with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccImageUpSyncQueue', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

