CREATE TABLE [dbo].[condo_style_code] (
    [style_cd]   VARCHAR (10) NOT NULL,
    [style_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_style_code] PRIMARY KEY CLUSTERED ([style_cd] ASC)
);


GO


create trigger tr_condo_style_code_delete_insert_update_MemTable
on condo_style_code
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
where szTableName = 'condo_style_code'

GO

