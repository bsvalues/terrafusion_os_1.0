CREATE TABLE [dbo].[udi_system_settings] (
    [id]                         SMALLINT NOT NULL,
    [preserve_original_property] BIT      NOT NULL,
    [sup_type_cd]                CHAR (6) NULL,
    CONSTRAINT [CPK_udi_system_settings] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_udi_system_settings_id] CHECK ([id] = 1)
);


GO


create trigger tr_udi_system_settings_delete_insert_update_MemTable
on udi_system_settings
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
where szTableName = 'udi_system_settings'

GO

