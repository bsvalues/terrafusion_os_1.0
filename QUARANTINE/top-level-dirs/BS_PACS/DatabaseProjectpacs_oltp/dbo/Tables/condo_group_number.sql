CREATE TABLE [dbo].[condo_group_number] (
    [condo_group_cd]   VARCHAR (10) NOT NULL,
    [condo_group_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_group_number] PRIMARY KEY CLUSTERED ([condo_group_cd] ASC)
);


GO


create trigger tr_condo_group_number_delete_insert_update_MemTable
on condo_group_number
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
where szTableName = 'condo_group_number'

GO

