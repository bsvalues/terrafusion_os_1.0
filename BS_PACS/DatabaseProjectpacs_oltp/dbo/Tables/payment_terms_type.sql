CREATE TABLE [dbo].[payment_terms_type] (
    [payment_terms_type_cd]   VARCHAR (10) NOT NULL,
    [payment_terms_type_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_payment_terms_type] PRIMARY KEY CLUSTERED ([payment_terms_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

create trigger [dbo].[tr_payment_terms_type_delete_insert_update_MemTable]
on [dbo].payment_terms_type
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
where szTableName = 'payment_terms_type'

GO

