CREATE TABLE [dbo].[land_meth] (
    [land_meth_cd]   CHAR (5)     NOT NULL,
    [land_meth_desc] VARCHAR (50) NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_land_meth] PRIMARY KEY CLUSTERED ([land_meth_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_land_meth_delete_insert_update_MemTable
on land_meth
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
where szTableName = 'land_meth'

GO

