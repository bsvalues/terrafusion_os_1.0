CREATE TABLE [dbo].[user_right_code_field] (
    [user_right_id] INT          NOT NULL,
    [table_name]    VARCHAR (50) NOT NULL,
    [field_name]    VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_user_right_code_field] PRIMARY KEY CLUSTERED ([user_right_id] ASC)
);


GO


create trigger tr_user_right_code_field_delete_insert_update_MemTable
on user_right_code_field
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
where szTableName = 'user_right_code_field'

GO

