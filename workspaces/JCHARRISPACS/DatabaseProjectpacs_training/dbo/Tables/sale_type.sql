CREATE TABLE [dbo].[sale_type] (
    [sl_type_cd]         CHAR (5)     NOT NULL,
    [sl_type_desc]       VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [sl_ptd_arms_length] CHAR (1)     NULL,
    CONSTRAINT [CPK_sale_type] PRIMARY KEY CLUSTERED ([sl_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_sale_type_delete_insert_update_MemTable
on sale_type
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
where szTableName = 'sale_type'

GO

