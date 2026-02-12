CREATE TABLE [dbo].[income_class] (
    [class_cd]   VARCHAR (10) NOT NULL,
    [class_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_class] PRIMARY KEY CLUSTERED ([class_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_income_class_delete_insert_update_MemTable
on income_class
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
where szTableName = 'income_class'

GO

