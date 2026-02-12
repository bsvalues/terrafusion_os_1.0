CREATE TABLE [dbo].[meta_letter_type_records_type_assoc] (
    [letter_type_cd] VARCHAR (15) NOT NULL,
    [records_uid]    VARCHAR (23) NOT NULL,
    CONSTRAINT [CPK_meta_letter_type_records_type_assoc] PRIMARY KEY CLUSTERED ([letter_type_cd] ASC, [records_uid] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_letter_type_records_type_assoc_letter_type_cd] FOREIGN KEY ([letter_type_cd]) REFERENCES [dbo].[letter_type] ([letter_type_cd]) ON DELETE CASCADE,
    CONSTRAINT [CFK_meta_letter_type_records_type_assoc_records_uid] FOREIGN KEY ([records_uid]) REFERENCES [dbo].[meta_records_object_type] ([records_uid]) ON DELETE CASCADE
);


GO


create trigger tr_meta_letter_type_records_type_assoc_delete_insert_update_MemTable
on meta_letter_type_records_type_assoc
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
where szTableName = 'meta_letter_type_records_type_assoc'

GO

