CREATE TABLE [dbo].[collection_pursuit_status] (
    [pursuit_status_code]        VARCHAR (10) NOT NULL,
    [pursuit_status_description] VARCHAR (50) NOT NULL,
    [pursuit_type_code]          VARCHAR (10) NOT NULL,
    [enable_fee]                 BIT          DEFAULT ((0)) NOT NULL,
    [fee_type_cd]                VARCHAR (10) NULL,
    [enable_event]               BIT          DEFAULT ((0)) NOT NULL,
    [litigation_event_type]      VARCHAR (10) NULL,
    CONSTRAINT [CPK_collection_pursuit_status] PRIMARY KEY CLUSTERED ([pursuit_status_code] ASC),
    CONSTRAINT [CFK_collection_pursuit_status_collection_pursuit_type] FOREIGN KEY ([pursuit_type_code]) REFERENCES [dbo].[collection_pursuit_type] ([pursuit_type_code])
);


GO


create trigger tr_collection_pursuit_status_delete_insert_update_MemTable
on collection_pursuit_status
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
where szTableName = 'collection_pursuit_status'

GO

