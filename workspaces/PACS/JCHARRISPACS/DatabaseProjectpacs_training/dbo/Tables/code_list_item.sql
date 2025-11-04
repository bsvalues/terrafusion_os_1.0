CREATE TABLE [dbo].[code_list_item] (
    [list_id] INT          NOT NULL,
    [code_id] VARCHAR (64) NOT NULL,
    [order]   INT          IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_code_list_item] PRIMARY KEY CLUSTERED ([list_id] ASC, [code_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_code_list_item_list_id] FOREIGN KEY ([list_id]) REFERENCES [dbo].[code_list] ([list_id])
);


GO




create trigger tr_code_list_item_delete_insert_update_MemTable
on code_list_item
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
where szTableName = 'code_list'

GO

