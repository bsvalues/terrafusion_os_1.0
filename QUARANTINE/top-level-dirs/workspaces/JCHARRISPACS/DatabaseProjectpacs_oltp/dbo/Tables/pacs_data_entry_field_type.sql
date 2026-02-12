CREATE TABLE [dbo].[pacs_data_entry_field_type] (
    [field_type]             INT          NOT NULL,
    [field_type_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_pacs_data_entry_field_type] PRIMARY KEY CLUSTERED ([field_type] ASC)
);


GO




create trigger tr_pacs_data_entry_field_type_delete_insert_update_MemTable
on pacs_data_entry_field_type
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
where szTableName = 'pacs_data_entry_field_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Description of the Field Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field_type', @level2type = N'COLUMN', @level2name = N'field_type_description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Field type identifier', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field_type', @level2type = N'COLUMN', @level2name = N'field_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'All Valid Field Types for the Pacs Data Entry Fields', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field_type';


GO

