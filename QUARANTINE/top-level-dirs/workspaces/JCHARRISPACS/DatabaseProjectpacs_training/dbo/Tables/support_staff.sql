CREATE TABLE [dbo].[support_staff] (
    [id]        INT          NOT NULL,
    [name]      VARCHAR (40) NOT NULL,
    [full_name] VARCHAR (75) NULL,
    CONSTRAINT [pk_support_staff] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO


create trigger tr_support_staff_delete_insert_update_MemTable
on support_staff
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
where szTableName = 'support_staff'

GO

