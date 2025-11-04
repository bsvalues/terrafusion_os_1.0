CREATE TABLE [dbo].[geo_format] (
    [geo_format_id]     INT           IDENTITY (1, 1) NOT NULL,
    [geo_format_name]   VARCHAR (50)  NULL,
    [geo_format_string] VARCHAR (100) NULL,
    CONSTRAINT [CPK_geo_format] PRIMARY KEY CLUSTERED ([geo_format_id] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_geo_format_delete_insert_update_MemTable
on geo_format
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
where szTableName = 'geo_format'

GO

