CREATE TABLE [dbo].[hof_exemption_setting] (
    [year]             NUMERIC (4)  NOT NULL,
    [exemption_amount] NUMERIC (14) NOT NULL,
    CONSTRAINT [CPK_hof_exemption_setting] PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_hof_exemption_setting_delete_insert_update_MemTable
on hof_exemption_setting
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
where szTableName = 'hof_exemption_setting'

GO

