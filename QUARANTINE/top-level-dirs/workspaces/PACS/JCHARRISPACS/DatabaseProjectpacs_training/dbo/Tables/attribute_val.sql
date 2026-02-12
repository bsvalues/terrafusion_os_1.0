CREATE TABLE [dbo].[attribute_val] (
    [imprv_attr_id]     INT          NOT NULL,
    [imprv_attr_val_cd] VARCHAR (75) NOT NULL,
    [sys_flag]          CHAR (1)     NULL,
    [cach_flag]         CHAR (1)     NULL,
    CONSTRAINT [CPK_attribute_val] PRIMARY KEY CLUSTERED ([imprv_attr_id] ASC, [imprv_attr_val_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_attribute_val_imprv_attr_id] FOREIGN KEY ([imprv_attr_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id])
);


GO



create trigger tr_attribute_val_delete_insert_update_MemTable
on attribute_val
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
where szTableName = 'attribute_val'

GO

