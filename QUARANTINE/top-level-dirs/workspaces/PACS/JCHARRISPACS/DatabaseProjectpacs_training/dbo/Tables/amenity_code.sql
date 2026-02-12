CREATE TABLE [dbo].[amenity_code] (
    [amenity_cd]   VARCHAR (10) NOT NULL,
    [amenity_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_amenity_code] PRIMARY KEY CLUSTERED ([amenity_cd] ASC)
);


GO


create trigger tr_amenity_code_delete_insert_update_MemTable
on amenity_code
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
where szTableName = 'amenity_code'

GO

