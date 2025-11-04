CREATE TABLE [dbo].[condo_characteristic_code] (
    [characteristic_cd]   VARCHAR (10) NOT NULL,
    [characteristic_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_characteristic_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC)
);


GO


create trigger tr_condo_characteristic_code_delete_insert_update_MemTable
on condo_characteristic_code
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
where szTableName = 'condo_characteristic_code'

GO

