CREATE TABLE [dbo].[levy_limit_type] (
    [levy_limit_type_cd]   VARCHAR (10) NOT NULL,
    [levy_limit_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_levy_limit_type] PRIMARY KEY CLUSTERED ([levy_limit_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_levy_limit_type_delete_insert_update_MemTable
on levy_limit_type
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
where szTableName = 'levy_limit_type'

GO

