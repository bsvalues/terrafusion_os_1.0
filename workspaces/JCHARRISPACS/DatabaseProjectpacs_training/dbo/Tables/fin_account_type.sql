CREATE TABLE [dbo].[fin_account_type] (
    [account_type_cd]          VARCHAR (25)  NOT NULL,
    [account_type_description] VARCHAR (255) NOT NULL,
    [core_account_type_id]     INT           NOT NULL,
    CONSTRAINT [CPK_fin_account_type] PRIMARY KEY CLUSTERED ([account_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fin_account_type_core_account_type_id] FOREIGN KEY ([core_account_type_id]) REFERENCES [dbo].[fin_core_account_type] ([core_account_type_id])
);


GO


create trigger tr_fin_account_type_delete_insert_update_MemTable
on fin_account_type
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
where szTableName = 'fin_account_type'

GO

