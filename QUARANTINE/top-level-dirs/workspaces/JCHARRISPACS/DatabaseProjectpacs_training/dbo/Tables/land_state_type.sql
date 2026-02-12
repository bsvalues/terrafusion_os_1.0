CREATE TABLE [dbo].[land_state_type] (
    [land_state_type_code] VARCHAR (10) NOT NULL,
    [land_state_type_desc] VARCHAR (50) NULL,
    [land_state_type_ind]  VARCHAR (5)  NULL,
    CONSTRAINT [CPK_land_state_type] PRIMARY KEY CLUSTERED ([land_state_type_code] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_land_state_type_delete_insert_update_MemTable
on land_state_type
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
where szTableName = 'land_state_type'

GO

