CREATE TABLE [dbo].[_arb_protest_panel] (
    [panel_cd]            VARCHAR (10)  NOT NULL,
    [panel_desc]          VARCHAR (50)  NULL,
    [panel_printer_name]  VARCHAR (256) NULL,
    [panel_computer_name] VARCHAR (50)  NULL,
    CONSTRAINT [CPK__arb_protest_panel] PRIMARY KEY CLUSTERED ([panel_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

create trigger tr__arb_protest_panel_delete_insert_update_MemTable
on _arb_protest_panel
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
where szTableName = '_arb_protest_panel'

GO

