CREATE TABLE [dbo].[building_permit_worksheet_type] (
    [type_cd]   VARCHAR (10) NOT NULL,
    [type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_building_permit_worksheet_type] PRIMARY KEY CLUSTERED ([type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_building_permit_worksheet_type_delete_insert_update_MemTable
on building_permit_worksheet_type
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
where szTableName = 'building_permit_worksheet_type'

GO

