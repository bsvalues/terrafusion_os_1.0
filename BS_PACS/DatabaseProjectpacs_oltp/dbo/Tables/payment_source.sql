CREATE TABLE [dbo].[payment_source] (
    [payment_source_id]   INT          NOT NULL,
    [payment_source_cd]   VARCHAR (5)  NULL,
    [payment_source_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_payment_source] PRIMARY KEY CLUSTERED ([payment_source_id] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_payment_source_delete_insert_update_MemTable
on payment_source
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
where szTableName = 'payment_source'

GO

