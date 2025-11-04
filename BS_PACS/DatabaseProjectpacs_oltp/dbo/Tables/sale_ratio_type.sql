CREATE TABLE [dbo].[sale_ratio_type] (
    [sl_ratio_type_cd] CHAR (5)     NOT NULL,
    [sl_ratio_desc]    VARCHAR (30) NULL,
    [invalid_sale]     BIT          NULL,
    [requires_reason]  BIT          NULL,
    CONSTRAINT [CPK_sale_ratio_type] PRIMARY KEY CLUSTERED ([sl_ratio_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_sale_ratio_type_delete_insert_update_MemTable
on sale_ratio_type
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
where szTableName = 'sale_ratio_type'

GO

