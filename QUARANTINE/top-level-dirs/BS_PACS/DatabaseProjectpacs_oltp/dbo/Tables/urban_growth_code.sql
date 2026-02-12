CREATE TABLE [dbo].[urban_growth_code] (
    [urban_growth_cd]   VARCHAR (10) NOT NULL,
    [urban_growth_desc] VARCHAR (50) NOT NULL,
    [sys_flag]          BIT          NULL,
    CONSTRAINT [CPK_urban_growth_code] PRIMARY KEY CLUSTERED ([urban_growth_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_urban_growth_code_delete_insert_update_MemTable
on urban_growth_code
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
where szTableName = 'urban_growth_code'

GO

