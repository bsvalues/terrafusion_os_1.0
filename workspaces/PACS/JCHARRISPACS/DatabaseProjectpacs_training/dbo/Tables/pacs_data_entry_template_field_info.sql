CREATE TABLE [dbo].[pacs_data_entry_template_field_info] (
    [template_id]       INT           NOT NULL,
    [field_id]          INT           NOT NULL,
    [existing_record]   BIT           DEFAULT ((1)) NOT NULL,
    [new_record]        BIT           DEFAULT ((0)) NOT NULL,
    [new_default_value] VARCHAR (MAX) NULL,
    [field_type]        INT           NULL,
    [next_id]           INT           CONSTRAINT [CDF_pacs_data_entry_template_field_info_next_id] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_pacs_data_entry_template_field_info] PRIMARY KEY CLUSTERED ([template_id] ASC, [field_id] ASC),
    CONSTRAINT [CFK_pacs_data_entry_template_field_info_pacs_data_entry_field] FOREIGN KEY ([field_id]) REFERENCES [dbo].[pacs_data_entry_field] ([field_id]),
    CONSTRAINT [CFK_pacs_data_entry_template_field_info_pacs_data_entry_template] FOREIGN KEY ([template_id]) REFERENCES [dbo].[pacs_data_entry_template] ([template_id])
);


GO




create trigger tr_pacs_data_entry_template_field_info_delete_insert_update_MemTable
on pacs_data_entry_template_field_info
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'pacs_data_entry_template_field_info'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'House field type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'field_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique field id in the pacs_data_entry_field table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'field_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique template Id the field info is for', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'template_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The default value to include in the grid for a new record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'new_default_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'All Fields included for a Template by a PACS User', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicates this field can be included in a new record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'new_record';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Houses the order the records were created.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'next_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates this is an existing record in the table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template_field_info', @level2type = N'COLUMN', @level2name = N'existing_record';


GO

