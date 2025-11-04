CREATE TABLE [dbo].[ccChecksum_TrackedData] (
    [data_type_id]      INT           IDENTITY (1, 1) NOT NULL,
    [data_desc]         VARCHAR (300) NOT NULL,
    [compare_proc_name] [sysname]     NOT NULL,
    [track_deletes]     BIT           NULL,
    CONSTRAINT [CPK_ccChecksum_TrackedData] PRIMARY KEY CLUSTERED ([data_type_id] ASC),
    CONSTRAINT [UNQ_ccChecksum_TrackedData_data_desc] UNIQUE NONCLUSTERED ([data_desc] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A description of the data to be tracked. May or may not be a specific table name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccChecksum_TrackedData', @level2type = N'COLUMN', @level2name = N'data_desc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Table of data to be tracked for changes to be sent to the cloud', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccChecksum_TrackedData';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique identity value for this record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccChecksum_TrackedData', @level2type = N'COLUMN', @level2name = N'data_type_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The name of the stored procedure used to check this data type for changes during the compare job run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccChecksum_TrackedData', @level2type = N'COLUMN', @level2name = N'compare_proc_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Value of 1 means insert deletes related to this data type to the TADM_CHANGE_TRACKING table during the compare job run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccChecksum_TrackedData', @level2type = N'COLUMN', @level2name = N'track_deletes';


GO

