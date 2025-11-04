CREATE TABLE [dbo].[meta_verb] (
    [verb_id] INT           IDENTITY (1, 1) NOT NULL,
    [verb]    NVARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_meta_verb] PRIMARY KEY CLUSTERED ([verb_id] ASC)
);


GO


create trigger tr_meta_verb_delete_insert_update_MemTable
on meta_verb
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
where szTableName = 'meta_verb'

GO

