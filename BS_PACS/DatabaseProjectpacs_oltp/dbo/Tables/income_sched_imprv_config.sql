CREATE TABLE [dbo].[income_sched_imprv_config] (
    [year]                   NUMERIC (4) NOT NULL,
    [match_by_economic_area] BIT         DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_config] PRIMARY KEY CLUSTERED ([year] ASC)
);


GO

 
create trigger [dbo].[tr_income_sched_imprv_config_delete_insert_update_MemTable]
on [dbo].[income_sched_imprv_config]
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
where szTableName = 'income_sched_imprv_config'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Year, primary key', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_sched_imprv_config', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = '1 to use economic area for a given year, 0 to use neighborhood.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_sched_imprv_config', @level2type = N'COLUMN', @level2name = N'match_by_economic_area';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'For each year, define whether income schedules for improvements will be matched by neighborhood code or economic area.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_sched_imprv_config';


GO

