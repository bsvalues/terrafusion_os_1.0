CREATE TABLE [dbo].[pp_class] (
    [pp_class_cd]   CHAR (5)     NOT NULL,
    [pp_class_desc] VARCHAR (50) NULL,
    [sys_flag]      CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_class] PRIMARY KEY CLUSTERED ([pp_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_pp_class_delete_insert_update_MemTable
on pp_class
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
where szTableName = 'pp_class'

GO

