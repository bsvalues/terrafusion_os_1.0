CREATE TABLE [dbo].[sales_exclude_calc] (
    [sales_exclude_calc_cd]   VARCHAR (10) NOT NULL,
    [sales_exclude_calc_desc] VARCHAR (50) NULL,
    [sys_flag]                CHAR (1)     NULL,
    CONSTRAINT [CPK_sales_exclude_calc] PRIMARY KEY CLUSTERED ([sales_exclude_calc_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_sales_exclude_calc_delete_insert_update_MemTable
on sales_exclude_calc
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
where szTableName = 'sales_exclude_calc'

GO

