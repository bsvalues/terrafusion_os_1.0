CREATE TABLE [dbo].[letter_template] (
    [id]                INT          IDENTITY (1, 1) NOT NULL,
    [template_name]     VARCHAR (50) NOT NULL,
    [template_datetime] DATETIME     NOT NULL,
    [template_type]     VARCHAR (10) NOT NULL,
    [computername]      VARCHAR (50) NULL,
    CONSTRAINT [CPK_letter_template] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_letter_template_delete_insert_update_MemTable
on letter_template
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
where szTableName = 'letter_template'

GO

