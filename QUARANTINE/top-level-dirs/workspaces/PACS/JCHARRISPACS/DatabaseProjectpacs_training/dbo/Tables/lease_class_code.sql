CREATE TABLE [dbo].[lease_class_code] (
    [class_cd]   VARCHAR (10) NOT NULL,
    [class_desc] VARCHAR (30) NULL,
    CONSTRAINT [CPK_lease_class_code] PRIMARY KEY CLUSTERED ([class_cd] ASC)
);


GO


create trigger tr_lease_class_code_delete_insert_update_MemTable
on lease_class_code
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
where szTableName = 'lease_class_code'

GO

