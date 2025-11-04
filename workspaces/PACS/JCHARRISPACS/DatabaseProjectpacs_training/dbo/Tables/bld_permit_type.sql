CREATE TABLE [dbo].[bld_permit_type] (
    [bld_permit_type_cd] VARCHAR (10) NOT NULL,
    [bld_permit_desc]    VARCHAR (50) NULL,
    [permit_type_flag]   CHAR (1)     NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_bld_permit_type] PRIMARY KEY CLUSTERED ([bld_permit_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_bld_permit_type_delete_insert_update_MemTable
on bld_permit_type
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
where szTableName = 'bld_permit_type'

GO

