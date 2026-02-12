CREATE TABLE [dbo].[pacs_user_rights] (
    [pacs_user_id]         INT      NOT NULL,
    [pacs_user_right_id]   INT      NOT NULL,
    [pacs_user_right_type] CHAR (1) NOT NULL,
    CONSTRAINT [CPK_pacs_user_rights] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [pacs_user_right_id] ASC, [pacs_user_right_type] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_pacs_user_rights_pacs_user_right_id_pacs_user_right_type] FOREIGN KEY ([pacs_user_right_id], [pacs_user_right_type]) REFERENCES [dbo].[user_rights] ([user_right_id], [user_right_type])
);


GO



create trigger tr_pacs_user_rights_delete_insert_update_MemTable
on pacs_user_rights
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
where szTableName = 'pacs_user_rights'

GO

