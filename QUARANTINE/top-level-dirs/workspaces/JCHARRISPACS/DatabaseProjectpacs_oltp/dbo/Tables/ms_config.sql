CREATE TABLE [dbo].[ms_config] (
    [year]                   NUMERIC (4) NOT NULL,
    [commercial_enabled]     BIT         DEFAULT ((0)) NOT NULL,
    [commercial_loaded]      BIT         DEFAULT ((0)) NOT NULL,
    [residential_enabled]    BIT         DEFAULT ((0)) NOT NULL,
    [residential_loaded]     BIT         DEFAULT ((0)) NOT NULL,
    [commercial_report_date] DATETIME    NULL,
    CONSTRAINT [CPK_ms_config] PRIMARY KEY CLUSTERED ([year] ASC)
);


GO


create trigger [dbo].[tr_ms_config_delete_insert_update_MemTable]
on [dbo].[ms_config]
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
where szTableName = 'ms_config'

GO


create trigger [dbo].[tr_ms_config_delete_insert_update_CodeLookupViews]
on [dbo].[ms_config]
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
exec dbo.MarshallSwiftCreateCodeLookupViews

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'M&S Commercial Report Date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ms_config', @level2type = N'COLUMN', @level2name = N'commercial_report_date';


GO

