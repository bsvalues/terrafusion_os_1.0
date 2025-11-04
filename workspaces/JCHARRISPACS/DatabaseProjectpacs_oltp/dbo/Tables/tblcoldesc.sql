CREATE TABLE [dbo].[tblcoldesc] (
    [table_name]     VARCHAR (127)  NOT NULL,
    [column_name]    VARCHAR (127)  NOT NULL,
    [human_language] VARCHAR (255)  NOT NULL,
    [column_format]  VARCHAR (2047) NULL,
    CONSTRAINT [CPK_tblcoldesc] PRIMARY KEY CLUSTERED ([table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_tblcoldesc_delete_insert_update_MemTable
on tblcoldesc
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
where szTableName = 'tblcoldesc'

GO

