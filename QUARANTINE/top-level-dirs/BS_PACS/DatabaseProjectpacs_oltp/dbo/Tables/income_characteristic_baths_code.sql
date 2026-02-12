CREATE TABLE [dbo].[income_characteristic_baths_code] (
    [baths_cd]   VARCHAR (5)  NOT NULL,
    [baths_desc] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_income_characteristic_baths_code] PRIMARY KEY CLUSTERED ([baths_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_income_characteristic_baths_code_delete_insert_update_MemTable
on income_characteristic_baths_code
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
where szTableName = 'income_characteristic_baths_code'

GO

