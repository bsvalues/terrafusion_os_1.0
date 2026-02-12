CREATE TABLE [dbo].[meta_custom_reports_publication] (
    [report_id] INT          NOT NULL,
    [role_type] INT          NOT NULL,
    [role_name] VARCHAR (50) NOT NULL,
    [role_id]   INT          NOT NULL,
    CONSTRAINT [CPK_meta_custom_reports_publication] PRIMARY KEY CLUSTERED ([report_id] ASC, [role_type] ASC, [role_name] ASC, [role_id] ASC),
    CONSTRAINT [CFK_meta_custom_reports_publication_meta_custom_reports] FOREIGN KEY ([report_id]) REFERENCES [dbo].[meta_custom_reports] ([report_id])
);


GO

create trigger [tr_meta_custom_reports_publication_delete_insert_update_MemTable]
on [dbo].[meta_custom_reports_publication]
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
where szTableName = 'meta_custom_reports_publication'

GO

