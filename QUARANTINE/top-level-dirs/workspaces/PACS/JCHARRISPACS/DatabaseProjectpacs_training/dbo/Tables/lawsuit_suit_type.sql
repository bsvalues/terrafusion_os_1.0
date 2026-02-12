CREATE TABLE [dbo].[lawsuit_suit_type] (
    [suit_type_cd]   VARCHAR (10) NOT NULL,
    [suit_type_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_lawsuit_suit_type] PRIMARY KEY CLUSTERED ([suit_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_lawsuit_suit_type_delete_insert_update_MemTable
on lawsuit_suit_type
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
where szTableName = 'lawsuit_suit_type'

GO

