CREATE TABLE [dbo].[code_list] (
    [list_id]    INT          IDENTITY (1, 1) NOT NULL,
    [name]       VARCHAR (64) NOT NULL,
    [code_table] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_code_list] PRIMARY KEY CLUSTERED ([list_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CUQ_code_list_code_table_name] UNIQUE NONCLUSTERED ([code_table] ASC, [name] ASC)
);


GO




create trigger tr_code_list_delete_insert_update_MemTable
on code_list
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

