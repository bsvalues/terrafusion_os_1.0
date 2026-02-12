CREATE TABLE [dbo].[lawsuit_event_type] (
    [event_cd]   VARCHAR (10) NOT NULL,
    [event_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_lawsuit_event_type] PRIMARY KEY CLUSTERED ([event_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_lawsuit_event_type_delete_insert_update_MemTable
on lawsuit_event_type
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
where szTableName = 'lawsuit_event_type'

GO

