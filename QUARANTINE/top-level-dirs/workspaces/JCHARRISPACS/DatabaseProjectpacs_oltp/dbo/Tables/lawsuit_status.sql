CREATE TABLE [dbo].[lawsuit_status] (
    [status_cd]        VARCHAR (10) NOT NULL,
    [status_desc]      VARCHAR (50) NULL,
    [new_default_flag] BIT          NULL,
    [inactive_flag]    BIT          NULL,
    CONSTRAINT [CPK_lawsuit_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


CREATE trigger [dbo].[tr_lawsuit_status_delete_insert_update_MemTable]
on [dbo].[lawsuit_status]
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
where szTableName = 'lawsuit_status'

GO

