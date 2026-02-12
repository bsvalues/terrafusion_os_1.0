CREATE TABLE [dbo].[phone_type] (
    [phone_type_cd]   CHAR (5)     NOT NULL,
    [phone_type_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_phone_type] PRIMARY KEY CLUSTERED ([phone_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_phone_type_delete_insert_update_MemTable
on phone_type
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
where szTableName = 'phone_type'

GO

