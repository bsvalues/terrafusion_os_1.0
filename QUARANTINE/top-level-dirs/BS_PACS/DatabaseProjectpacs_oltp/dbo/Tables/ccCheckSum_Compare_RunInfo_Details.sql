CREATE TABLE [dbo].[ccCheckSum_Compare_RunInfo_Details] (
    [run_id]                  INT            NOT NULL,
    [data_type_id]            INT            NOT NULL,
    [prop_id]                 INT            NOT NULL,
    [isNew]                   BIT            NULL,
    [isDel]                   BIT            NULL,
    [PKColNames]              VARCHAR (500)  NOT NULL,
    [PKValues]                VARCHAR (1000) NOT NULL,
    [valid_for_cloud]         BIT            NULL,
    [new_for_cloud]           BIT            NULL,
    [inserted_to_queue_table] BIT            NULL,
    [pacs_user_id]            INT            NULL,
    [pacs_user_name]          VARCHAR (50)   NULL,
    [image_path]              VARCHAR (255)  NULL,
    [child_prop_id]           INT            NULL
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator is set to 1 if this record is a valid record for cloud processing', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'valid_for_cloud';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Compare Job Run Details', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique user id value updated only by the pacs_user compare procedure. No other compare types will have this value updated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Id value of the property with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Child property id. Only updated by the property_assoc compare procedure. No other compare types will have this value updated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'child_prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pipe delimited list of columns making up primary key of the table being processed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'PKColNames';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator is set to 1 if this property id is being inserted into the ccProperty table during the compare job run. Indicates new to cloud', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'new_for_cloud';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The run id that this entry was created. Related to ccCheckSum_Compare_RunInfo table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'User name value updated only by the pacs_user compare procedure. No other compare types will have this value updated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'pacs_user_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator is set to 1 if this record is an insert to the PACS table being compared', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'isNew';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pipe delimited list of values in the Primary key columns of the table being processed to uniquely identify the record being processed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'PKValues';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator is set to 1 if this property id is being inserted into the ccUpSyncQueue table to indicate changes were made to this property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'inserted_to_queue_table';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The data type id that this entry was created. Related to ccChecksum_TrackedData table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'data_type_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Full path of image to be synced. Only updated by the image compare procedures. No other compare types will have this value updated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'image_path';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator is set to 1 if this record is a delete to the PACS table being compared', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccCheckSum_Compare_RunInfo_Details', @level2type = N'COLUMN', @level2name = N'isDel';


GO

