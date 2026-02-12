CREATE TABLE [dbo].[curr_use_rollback_config] (
    [year]         NUMERIC (4)  NOT NULL,
    [update_by_id] INT          NULL,
    [update_date]  DATETIME     NULL,
    [fee_type_cd]  VARCHAR (10) NOT NULL,
    PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_curr_use_rollback_config_fee_type_cd] FOREIGN KEY ([fee_type_cd]) REFERENCES [dbo].[fee_type] ([fee_type_cd])
);


GO


create trigger tr_curr_use_rollback_config_delete_insert_update_MemTable
on curr_use_rollback_config
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
where szTableName = 'curr_use_rollback_config'

GO

