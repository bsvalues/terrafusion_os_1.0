CREATE TABLE [dbo].[meta_field_info] (
    [records_uid]    VARCHAR (23)   NOT NULL,
    [table_name]     VARCHAR (127)  NOT NULL,
    [column_name]    VARCHAR (127)  NOT NULL,
    [column_desc]    VARCHAR (255)  NOT NULL,
    [column_tip]     VARCHAR (255)  NOT NULL,
    [sample_data]    VARCHAR (2047) NOT NULL,
    [show_in_letter] BIT            NOT NULL,
    CONSTRAINT [CPK_meta_field_info] PRIMARY KEY CLUSTERED ([records_uid] ASC, [table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_field_info_records_uid] FOREIGN KEY ([records_uid]) REFERENCES [dbo].[meta_records_object_type] ([records_uid]) ON DELETE CASCADE
);


GO


create trigger tr_meta_field_info_delete_insert_update_MemTable
on meta_field_info
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
where szTableName = 'meta_field_info'

GO

