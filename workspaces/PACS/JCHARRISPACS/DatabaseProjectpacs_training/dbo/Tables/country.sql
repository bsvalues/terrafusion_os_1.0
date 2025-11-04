CREATE TABLE [dbo].[country] (
    [country_cd]   CHAR (5)     NOT NULL,
    [country_name] VARCHAR (50) NULL,
    [sys_flag]     CHAR (1)     NULL,
    CONSTRAINT [CPK_country] PRIMARY KEY CLUSTERED ([country_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_country_delete_insert_update_MemTable
on country
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
where szTableName = 'country'

GO

