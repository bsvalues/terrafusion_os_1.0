CREATE TABLE [dbo].[reappraisal_status] (
    [reappraisal_status_cd]   VARCHAR (20) NOT NULL,
    [reappraisal_status_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_reappraisal_status] PRIMARY KEY CLUSTERED ([reappraisal_status_cd] ASC)
);


GO


create trigger tr_reappraisal_status_delete_insert_update_MemTable
on reappraisal_status
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
where szTableName = 'reappraisal_status'

GO

