CREATE TABLE [dbo].[ms_mult_type] (
    [mult_type_cd]   CHAR (2)     NOT NULL,
    [mult_type_desc] VARCHAR (20) NULL,
    [sys_flag]       CHAR (1)     NULL,
    CONSTRAINT [CPK_ms_mult_type] PRIMARY KEY CLUSTERED ([mult_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_ms_mult_type_delete_insert_update_MemTable
on ms_mult_type
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
where szTableName = 'ms_mult_type'

GO

