CREATE TABLE [dbo].[condo_material_code] (
    [material_cd]   VARCHAR (10) NOT NULL,
    [material_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_material_code] PRIMARY KEY CLUSTERED ([material_cd] ASC)
);


GO


create trigger tr_condo_material_code_delete_insert_update_MemTable
on condo_material_code
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
where szTableName = 'condo_material_code'

GO

