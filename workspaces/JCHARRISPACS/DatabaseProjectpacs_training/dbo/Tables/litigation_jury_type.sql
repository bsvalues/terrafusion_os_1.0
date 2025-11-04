CREATE TABLE [dbo].[litigation_jury_type] (
    [litigation_jury_type_cd]   VARCHAR (10) NOT NULL,
    [litigation_jury_type_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_litigation_jury_type] PRIMARY KEY CLUSTERED ([litigation_jury_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_litigation_jury_type_delete_insert_update_MemTable
on litigation_jury_type
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
where szTableName = 'litigation_jury_type'

GO

