CREATE TABLE [dbo].[mail_returned_type] (
    [ml_return_type_cd]  CHAR (5)     NOT NULL,
    [ml_return_typ_desc] VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_mail_returned_type] PRIMARY KEY CLUSTERED ([ml_return_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_mail_returned_type_delete_insert_update_MemTable
on mail_returned_type
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
where szTableName = 'mail_returned_type'

GO

