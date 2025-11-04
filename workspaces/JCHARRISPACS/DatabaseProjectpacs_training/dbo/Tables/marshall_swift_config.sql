CREATE TABLE [dbo].[marshall_swift_config] (
    [year]     NUMERIC (4) NOT NULL,
    [ms_year]  INT         NULL,
    [ms_month] INT         NULL,
    CONSTRAINT [CPK_marshall_swift_config] PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger [dbo].[tr_marshall_swift_config_delete_insert_update_MemTable]
on [dbo].[marshall_swift_config]
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
where szTableName = 'marshall_swift_config'

GO

