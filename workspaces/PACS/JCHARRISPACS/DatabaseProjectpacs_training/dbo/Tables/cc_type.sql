CREATE TABLE [dbo].[cc_type] (
    [cc_type] VARCHAR (5)  NOT NULL,
    [cc_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_cc_type] PRIMARY KEY CLUSTERED ([cc_type] ASC) WITH (FILLFACTOR = 100)
);


GO


Create trigger [dbo].[tr_cc_type_delete_insert_update_MemTable]
on [dbo].[cc_type]
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
where szTableName = 'cc_type';

GO

