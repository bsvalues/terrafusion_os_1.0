CREATE TABLE [dbo].[_arb_event_type] (
    [szARBType] VARCHAR (2)  NOT NULL,
    [szCode]    VARCHAR (10) NOT NULL,
    [szDesc]    VARCHAR (50) NULL,
    [sys_flag]  CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_event_type] PRIMARY KEY CLUSTERED ([szARBType] ASC, [szCode] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_event_type_delete_insert_update_MemTable
on _arb_event_type
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
where szTableName = '_arb_event_type'

GO

