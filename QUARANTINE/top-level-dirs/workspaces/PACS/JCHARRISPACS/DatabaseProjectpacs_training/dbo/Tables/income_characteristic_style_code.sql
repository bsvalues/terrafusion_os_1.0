CREATE TABLE [dbo].[income_characteristic_style_code] (
    [style_cd]   VARCHAR (20) NOT NULL,
    [style_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_income_characteristic_style_code] PRIMARY KEY CLUSTERED ([style_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_income_characteristic_style_code_delete_insert_update_MemTable
on income_characteristic_style_code
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
where szTableName = 'income_characteristic_style_code'

GO

