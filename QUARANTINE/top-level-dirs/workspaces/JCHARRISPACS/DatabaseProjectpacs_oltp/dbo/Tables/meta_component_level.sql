CREATE TABLE [dbo].[meta_component_level] (
    [component_level_id] INT           NOT NULL,
    [component_id]       INT           NULL,
    [display_text]       VARCHAR (50)  NOT NULL,
    [description]        VARCHAR (255) NULL,
    [display_order]      INT           NOT NULL,
    [parent_level]       INT           NULL,
    [context]            VARCHAR (100) NULL,
    CONSTRAINT [CPK_meta_component_level] PRIMARY KEY CLUSTERED ([component_level_id] ASC)
);


GO


create trigger tr_meta_component_level_delete_insert_update_MemTable
on meta_component_level
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
where szTableName = 'meta_component_level'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The context for the Meta Component Level', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_component_level', @level2type = N'COLUMN', @level2name = N'context';


GO

