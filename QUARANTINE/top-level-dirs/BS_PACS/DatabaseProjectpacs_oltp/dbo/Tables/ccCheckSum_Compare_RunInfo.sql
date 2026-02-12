CREATE TABLE [dbo].[ccCheckSum_Compare_RunInfo] (
    [run_id]                                                INT      IDENTITY (1, 1) NOT NULL,
    [start_time]                                            DATETIME CONSTRAINT [CDF_ccCheckSum_RunInfo_start_time] DEFAULT (getdate()) NOT NULL,
    [end_time]                                              DATETIME NULL,
    [detail_record_count]                                   BIGINT   NULL,
    [run_type]                                              TINYINT  NULL,
    [PropertyQueueInserts]                                  INT      NULL,
    [DeleteQueueInserts]                                    INT      NULL,
    [UserQueueInserts]                                      INT      NULL,
    [NewCloudProperties]                                    INT      NULL,
    [MainImageQueueInserts]                                 INT      NULL,
    [ccAssignmentGroupQueueInserts]                         INT      NULL,
    [insert_all_qualified_properties_to_ccProperty_setting] CHAR (1) NULL,
    CONSTRAINT [CPK_ccCheckSum_Compare_RunInfo] PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_start_time]
    ON [dbo].[ccCheckSum_Compare_RunInfo]([start_time] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total records inserted into the ccUserSyncQueue table for this compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'UserQueueInserts';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Compare Job Run Summary Information', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total records inserted into the ccAssignmentGroupQueue table for this compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'ccAssignmentGroupQueueInserts';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'End date/time for this compare job run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'end_time';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total unique property id values inserted into the ccUpSyncQueue table for this compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'PropertyQueueInserts';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total records inserted into the ccProperty table for this compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'NewCloudProperties';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The unique run id associated with a compare job run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Setting value for this run retrieved from table ccCheckSum_Compare_Procedure_Run_Settings', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'insert_all_qualified_properties_to_ccProperty_setting';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total number of records with changes for this compare job run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'detail_record_count';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total records inserted into the TADM_CHANGE_TRACKING table for this compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'DeleteQueueInserts';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Total records inserted into the ccImageUpSyncQueue table for this compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'MainImageQueueInserts';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Start date/time for this compare job run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'start_time';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Value of 1 indicates an initialize base compare tables run. Value of 2 indicates a compare run.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo', @level2type = N'COLUMN', @level2name = N'run_type';


GO

