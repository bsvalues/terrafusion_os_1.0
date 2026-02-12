CREATE TABLE [dbo].[lawsuit_contact_type] (
    [contact_cd]   VARCHAR (10) NOT NULL,
    [contact_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_lawsuit_contact_type] PRIMARY KEY CLUSTERED ([contact_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


Create trigger [dbo].[tr_lawsuit_contact_type_delete_insert_update_MemTable]
on [dbo].[lawsuit_contact_type]
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
where szTableName = 'lawsuit_contact_type';

GO

