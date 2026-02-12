CREATE TABLE [dbo].[core_config] (
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_core_config] PRIMARY KEY CLUSTERED ([szGroup] ASC, [szConfigName] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_core_config_delete_insert_update_MemTable
on core_config
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
where szTableName = 'core_config'

GO

