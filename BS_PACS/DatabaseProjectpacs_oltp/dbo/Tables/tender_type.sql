CREATE TABLE [dbo].[tender_type] (
    [tender_type_cd]   VARCHAR (50)  NOT NULL,
    [tender_type_desc] VARCHAR (255) NULL,
    CONSTRAINT [CPK_tender_type] PRIMARY KEY CLUSTERED ([tender_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_tender_type_delete_insert_update_MemTable
on tender_type
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
where szTableName = 'tender_type'

GO

