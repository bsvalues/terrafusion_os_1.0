CREATE TABLE [dbo].[region] (
    [rgn_cd]        VARCHAR (5)    NOT NULL,
    [rgn_name]      VARCHAR (50)   NULL,
    [rgn_pct]       VARCHAR (50)   NULL,
    [sys_flag]      CHAR (1)       NULL,
    [rgn_imprv_pct] NUMERIC (5, 2) NULL,
    [rgn_land_pct]  NUMERIC (5, 2) NULL,
    CONSTRAINT [CPK_region] PRIMARY KEY CLUSTERED ([rgn_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_region_delete_insert_update_MemTable
on region
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
where szTableName = 'region'

GO

