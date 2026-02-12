CREATE TABLE [dbo].[income_level] (
    [level_cd]   VARCHAR (10) NOT NULL,
    [level_desc] CHAR (20)    NULL,
    CONSTRAINT [CPK_income_level] PRIMARY KEY CLUSTERED ([level_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_income_level_delete_insert_update_MemTable
on income_level
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
where szTableName = 'income_level'

GO

