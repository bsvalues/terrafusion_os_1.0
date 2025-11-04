CREATE TABLE [dbo].[pp_rendition_penalty] (
    [rendition_year]  NUMERIC (4) NOT NULL,
    [calculate_dt]    DATETIME    NULL,
    [export_dt]       DATETIME    NULL,
    [import_dt]       DATETIME    NULL,
    [create_bills_dt] DATETIME    NULL,
    [set_flags_dt]    DATETIME    NULL,
    CONSTRAINT [CPK_pp_rendition_penalty] PRIMARY KEY CLUSTERED ([rendition_year] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_pp_rendition_penalty_delete_insert_update_MemTable
on pp_rendition_penalty
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
where szTableName = 'pp_rendition_penalty'

GO

