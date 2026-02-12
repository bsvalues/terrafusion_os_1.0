CREATE TABLE [dbo].[owner_link_type_code] (
    [linked_cd]  VARCHAR (10) NOT NULL,
    [linked_des] VARCHAR (50) NULL,
    CONSTRAINT [CPK_owner_link_type_code] PRIMARY KEY CLUSTERED ([linked_cd] ASC)
);


GO


create trigger tr_owner_link_type_code_delete_insert_update_MemTable
on owner_link_type_code
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
where szTableName = 'owner_link_type_code'

GO

