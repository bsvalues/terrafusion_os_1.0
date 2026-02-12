CREATE TABLE [dbo].[user_core_config] (
    [user_id]       INT           NOT NULL,
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_user_core_config] PRIMARY KEY CLUSTERED ([user_id] ASC, [szGroup] ASC, [szConfigName] ASC),
    CONSTRAINT [CFK_user_core_config_pacs_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id]) ON DELETE CASCADE
);


GO


create trigger tr_user_core_config_delete_insert_update_MemTable
on user_core_config
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
where szTableName = 'user_core_config'

GO

