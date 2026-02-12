CREATE TABLE [dbo].[user_role] (
    [role_id]            INT           NOT NULL,
    [role_description]   VARCHAR (255) NOT NULL,
    [role_type]          TINYINT       DEFAULT (1) NOT NULL,
    [role_sub_attribute] TINYINT       DEFAULT (1) NOT NULL,
    CONSTRAINT [CPK_user_role] PRIMARY KEY CLUSTERED ([role_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_user_role_delete_insert_update_MemTable
on user_role
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
where szTableName = 'user_role'

GO

