CREATE TABLE [dbo].[land_soil] (
    [szLandSoilCode] CHAR (10)    NOT NULL,
    [szLandSoilDesc] VARCHAR (64) NULL,
    CONSTRAINT [CPK_land_soil] PRIMARY KEY CLUSTERED ([szLandSoilCode] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_land_soil_delete_insert_update_MemTable
on land_soil
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
where szTableName = 'land_soil'

GO

