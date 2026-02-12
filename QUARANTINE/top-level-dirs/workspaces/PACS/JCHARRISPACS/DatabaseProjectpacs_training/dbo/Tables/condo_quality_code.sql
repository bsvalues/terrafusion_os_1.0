CREATE TABLE [dbo].[condo_quality_code] (
    [quality_cd]   VARCHAR (10) NOT NULL,
    [quality_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_quality_code] PRIMARY KEY CLUSTERED ([quality_cd] ASC)
);


GO


create trigger tr_condo_quality_code_delete_insert_update_MemTable
on condo_quality_code
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
where szTableName = 'condo_quality_code'

GO

