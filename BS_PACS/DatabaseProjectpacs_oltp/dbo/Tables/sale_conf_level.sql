CREATE TABLE [dbo].[sale_conf_level] (
    [sl_conf_lvl_cd]     CHAR (5)     NOT NULL,
    [sl_conf_lvl_desc]   VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [sl_conf_lvl_ptd_cd] CHAR (3)     NULL,
    CONSTRAINT [CPK_sale_conf_level] PRIMARY KEY CLUSTERED ([sl_conf_lvl_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_sale_conf_level_delete_insert_update_MemTable
on sale_conf_level
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
where szTableName = 'sale_conf_level'

GO

