CREATE TABLE [dbo].[supplement_type] (
    [sup_type_cd]    CHAR (10)    NOT NULL,
    [sup_type_desc]  VARCHAR (50) NULL,
    [sys_flag]       VARCHAR (1)  NULL,
    [supp_attribute] INT          NULL,
    CONSTRAINT [CPK_supplement_type] PRIMARY KEY CLUSTERED ([sup_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_supplement_type_delete_insert_update_MemTable
on supplement_type
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
where szTableName = 'supplement_type'

GO

