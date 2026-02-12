CREATE TABLE [dbo].[sale_adjustment] (
    [sl_adj_cd]   CHAR (5)     NOT NULL,
    [sl_adj_desc] VARCHAR (30) NULL,
    [sys_flag]    CHAR (1)     NULL,
    CONSTRAINT [CPK_sale_adjustment] PRIMARY KEY CLUSTERED ([sl_adj_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_sale_adjustment_delete_insert_update_MemTable
on sale_adjustment
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
where szTableName = 'sale_adjustment'

GO

