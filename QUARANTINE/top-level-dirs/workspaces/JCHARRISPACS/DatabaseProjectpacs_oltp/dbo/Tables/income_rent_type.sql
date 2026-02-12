CREATE TABLE [dbo].[income_rent_type] (
    [rent_type_cd]   VARCHAR (10) NOT NULL,
    [rent_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_rent_type] PRIMARY KEY CLUSTERED ([rent_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_income_rent_type_delete_insert_update_MemTable
on income_rent_type
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
where szTableName = 'income_rent_type'

GO

