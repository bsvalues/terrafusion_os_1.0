CREATE TABLE [dbo].[pacs_config_year] (
    [year]          NUMERIC (4)   NOT NULL,
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_pacs_config_year] PRIMARY KEY CLUSTERED ([year] ASC, [szGroup] ASC, [szConfigName] ASC)
);


GO


create trigger tr_pacs_config_year_delete_insert_update_MemTable
on pacs_config_year
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
where szTableName = 'pacs_config_year'

GO

