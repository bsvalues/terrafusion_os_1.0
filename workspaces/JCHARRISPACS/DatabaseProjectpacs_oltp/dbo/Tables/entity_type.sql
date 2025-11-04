CREATE TABLE [dbo].[entity_type] (
    [entity_type_cd]   CHAR (5)     NOT NULL,
    [entity_type_desc] VARCHAR (50) NOT NULL,
    [sys_flag]         CHAR (1)     NULL,
    CONSTRAINT [CPK_entity_type] PRIMARY KEY CLUSTERED ([entity_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_entity_type_delete_insert_update_MemTable
on entity_type
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
where szTableName = 'entity_type'

GO

