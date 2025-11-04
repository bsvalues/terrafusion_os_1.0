CREATE TABLE [dbo].[timber_assessed_type] (
    [timber_assessed_type_cd]   VARCHAR (10) NOT NULL,
    [timber_assessed_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_timber_assessed_type] PRIMARY KEY CLUSTERED ([timber_assessed_type_cd] ASC)
);


GO

create trigger [dbo].[tr_timber_assessed_type_delete_insert_update_MemTable]
on [dbo].[timber_assessed_type]
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
where szTableName = 'timber_assessed_type'

GO

