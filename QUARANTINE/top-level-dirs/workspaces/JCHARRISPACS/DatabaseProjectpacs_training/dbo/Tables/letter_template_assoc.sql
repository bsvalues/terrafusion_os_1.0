CREATE TABLE [dbo].[letter_template_assoc] (
    [template_id]  INT            NOT NULL,
    [letter_id]    INT            NOT NULL,
    [copies]       INT            NOT NULL,
    [printer_name] VARCHAR (1024) NULL,
    CONSTRAINT [CPK_letter_template_assoc] PRIMARY KEY CLUSTERED ([template_id] ASC, [letter_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_letter_template_assoc_delete_insert_update_MemTable
on letter_template_assoc
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
where szTableName = 'letter_template_assoc'

GO

