CREATE TABLE [dbo].[building_permit_worksheet_config] (
    [bp_worksheet_component_id]      INT            IDENTITY (100000, 1) NOT NULL,
    [bp_worksheet_component_name]    VARCHAR (255)  NOT NULL,
    [bp_worksheet_component_percent] NUMERIC (5, 2) NOT NULL,
    [type_cd]                        VARCHAR (10)   NULL,
    CONSTRAINT [CPK_building_permit_worksheet_config] PRIMARY KEY CLUSTERED ([bp_worksheet_component_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_building_permit_worksheet_config_type_cd] FOREIGN KEY ([type_cd]) REFERENCES [dbo].[building_permit_worksheet_type] ([type_cd])
);


GO


create trigger tr_building_permit_worksheet_config_delete_insert_update_MemTable
on building_permit_worksheet_config
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
where szTableName = 'building_permit_worksheet_config'

GO

