CREATE TABLE [dbo].[sub_market] (
    [sub_market_cd]   VARCHAR (10) NOT NULL,
    [sub_market_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_sub_market] PRIMARY KEY CLUSTERED ([sub_market_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_sub_market_delete_insert_update_MemTable
on sub_market
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
where szTableName = 'sub_market'

GO

