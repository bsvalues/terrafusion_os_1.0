CREATE TABLE [dbo].[address_type] (
    [addr_type_cd]   CHAR (5)     NOT NULL,
    [addr_type_desc] VARCHAR (50) NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_address_type] PRIMARY KEY CLUSTERED ([addr_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_address_type_delete_insert_update_MemTable
on address_type
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
where szTableName = 'address_type'

GO

