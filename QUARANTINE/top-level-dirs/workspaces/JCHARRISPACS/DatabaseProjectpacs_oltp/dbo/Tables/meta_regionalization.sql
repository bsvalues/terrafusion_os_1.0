CREATE TABLE [dbo].[meta_regionalization] (
    [regionalization_id] INT            IDENTITY (1, 1) NOT NULL,
    [default_text]       NVARCHAR (255) NOT NULL,
    [regionalized_text]  NVARCHAR (255) NOT NULL,
    [system]             BIT            CONSTRAINT [CDF_meta_regionalization_system] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_meta_regionalization] PRIMARY KEY CLUSTERED ([regionalization_id] ASC, [default_text] ASC)
);


GO




create trigger tr_meta_regionalization_delete_insert_update_MemTable
on meta_regionalization
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
where szTableName = 'meta_regionalization'

GO

