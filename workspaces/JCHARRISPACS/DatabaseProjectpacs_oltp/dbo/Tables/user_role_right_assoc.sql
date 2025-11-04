CREATE TABLE [dbo].[user_role_right_assoc] (
    [role_id]       INT NOT NULL,
    [user_right_id] INT NOT NULL,
    CONSTRAINT [CPK_user_role_right_assoc] PRIMARY KEY CLUSTERED ([role_id] ASC, [user_right_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_user_role_right_assoc_role_id] FOREIGN KEY ([role_id]) REFERENCES [dbo].[user_role] ([role_id]) ON DELETE CASCADE
);


GO


create trigger tr_user_role_right_assoc_delete_insert_update_MemTable
on user_role_right_assoc
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
where szTableName = 'user_role_right_assoc'

GO

