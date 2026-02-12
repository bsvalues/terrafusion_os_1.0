CREATE TABLE [dbo].[bld_permit_sub_type] (
    [PermitSubtypeCode] VARCHAR (5)  NOT NULL,
    [Description]       VARCHAR (50) NULL,
    CONSTRAINT [CPK_bld_permit_sub_type] PRIMARY KEY CLUSTERED ([PermitSubtypeCode] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_bld_permit_sub_type_delete_insert_update_MemTable
on bld_permit_sub_type
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
where szTableName = 'bld_permit_sub_type'

GO

