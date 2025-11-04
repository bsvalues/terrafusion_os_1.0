CREATE TABLE [dbo].[meta_report_dialog] (
    [dialog_id]   INT           IDENTITY (1, 1) NOT NULL,
    [name]        VARCHAR (255) NOT NULL,
    [dialog]      VARCHAR (255) NOT NULL,
    [description] VARCHAR (255) NULL,
    [report_name] VARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_report_dialog] PRIMARY KEY CLUSTERED ([dialog_id] ASC, [name] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [UC_meta_report_dialog__name] UNIQUE NONCLUSTERED ([name] ASC)
);


GO


create trigger tr_meta_report_dialog_delete_insert_update_MemTable
on meta_report_dialog
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
where szTableName = 'meta_report_dialog'

GO

