CREATE TABLE [dbo].[subset] (
    [subset_code]      VARCHAR (5)    NOT NULL,
    [subset_desc]      VARCHAR (50)   NULL,
    [sys_flag]         CHAR (1)       NULL,
    [subset_imprv_pct] NUMERIC (5, 2) NULL,
    [subset_land_pct]  NUMERIC (5, 2) NULL,
    CONSTRAINT [CPK_subset] PRIMARY KEY CLUSTERED ([subset_code] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_subset_delete_insert_update_MemTable
on subset
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
where szTableName = 'subset'

GO

