CREATE TABLE [dbo].[payment_code] (
    [pay_type_cd]   CHAR (5)        NOT NULL,
    [pay_type_desc] VARCHAR (50)    NULL,
    [pay_type_amt]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_payment_code] PRIMARY KEY CLUSTERED ([pay_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_payment_code_delete_insert_update_MemTable
on payment_code
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
where szTableName = 'payment_code'

GO

