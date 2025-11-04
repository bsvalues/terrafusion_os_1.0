CREATE TABLE [dbo].[imprv_sched_unit_mix] (
    [code]        VARCHAR (12) NOT NULL,
    [description] VARCHAR (30) NULL,
    CONSTRAINT [CPK_unit_mix] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO


create trigger tr_imprv_sched_unit_mix_delete_insert_update_MemTable
on imprv_sched_unit_mix
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
where szTableName = 'imprv_sched_unit_mix'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unit Mix codefile table, used in income schedules for improvements', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_sched_unit_mix';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unit Mix code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_sched_unit_mix', @level2type = N'COLUMN', @level2name = N'code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unit Mix description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_sched_unit_mix', @level2type = N'COLUMN', @level2name = N'description';


GO

