CREATE TABLE [dbo].[condo_stories_code] (
    [stories_cd]   VARCHAR (10) NOT NULL,
    [stories_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_stories_code] PRIMARY KEY CLUSTERED ([stories_cd] ASC)
);


GO


create trigger tr_condo_stories_code_delete_insert_update_MemTable
on condo_stories_code
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
where szTableName = 'condo_stories_code'

GO

