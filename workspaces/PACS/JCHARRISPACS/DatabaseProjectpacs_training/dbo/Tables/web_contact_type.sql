CREATE TABLE [dbo].[web_contact_type] (
    [web_contact_type_cd]   VARCHAR (5)  NOT NULL,
    [web_contact_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_web_contact_type] PRIMARY KEY CLUSTERED ([web_contact_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

create trigger [dbo].[tr_web_contact_type_delete_insert_update_MemTable]
on [dbo].[web_contact_type]
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
where szTableName = 'web_contact_type'

GO

