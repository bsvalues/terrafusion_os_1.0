CREATE TABLE [dbo].[payment_status_type] (
    [payment_status_type_cd]   VARCHAR (10) NOT NULL,
    [payment_status_type_desc] VARCHAR (50) NULL,
    [sys_flag]                 BIT          NULL,
    CONSTRAINT [CPK_payment_status_type] PRIMARY KEY CLUSTERED ([payment_status_type_cd] ASC)
);


GO


create trigger [dbo].[tr_payment_status_type_delete_insert_update_MemTable]
on payment_status_type
for delete, insert, update
not for replication
as
begin 

	if ( @@rowcount = 0 )
			return
	 
	set nocount on
	 
	update table_cache_status with(rowlock)
	set lDummy = 0
	where szTableName = 'payment_status_type'

end

GO

