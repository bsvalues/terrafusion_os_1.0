CREATE TABLE [dbo].[_arb_inquiry_value_reason] (
    [assigned_value_reason_cd]   VARCHAR (10) NOT NULL,
    [assigned_value_reason_desc] VARCHAR (50) NULL,
    [sys_flag]                   CHAR (1)     CONSTRAINT [CDF__arb_inquiry_value_reason_sys_flag] DEFAULT ('F') NULL,
    CONSTRAINT [CPK__arb_inquiry_value_reason] PRIMARY KEY CLUSTERED ([assigned_value_reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

create trigger tr__arb_inquiry_value_reason_delete_insert_update_MemTable
on _arb_inquiry_value_reason
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
where szTableName = '_arb_inquiry_value_reason'

GO

