CREATE TABLE [dbo].[user_role_user_assoc] (
    [pacs_user_id] INT NOT NULL,
    [role_id]      INT NOT NULL,
    [default_role] BIT DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_user_role_user_assoc] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [role_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_user_role_user_assoc_pacs_user_id] FOREIGN KEY ([pacs_user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_user_role_user_assoc_role_id] FOREIGN KEY ([role_id]) REFERENCES [dbo].[user_role] ([role_id]) ON DELETE CASCADE
);


GO



create trigger tr_user_role_user_assoc_delete_insert_update_MemTable
on user_role_user_assoc
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
where szTableName = 'user_role_user_assoc'

GO

