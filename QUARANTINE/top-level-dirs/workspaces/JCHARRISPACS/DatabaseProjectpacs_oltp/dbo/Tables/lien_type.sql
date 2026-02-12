CREATE TABLE [dbo].[lien_type] (
    [lien_type_code]        VARCHAR (20) NOT NULL,
    [lien_type_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_lien_type] PRIMARY KEY CLUSTERED ([lien_type_code] ASC)
);


GO




create trigger tr_lien_type_delete_insert_update_MemTable
on lien_type
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
where szTableName = 'lien_type'

GO

