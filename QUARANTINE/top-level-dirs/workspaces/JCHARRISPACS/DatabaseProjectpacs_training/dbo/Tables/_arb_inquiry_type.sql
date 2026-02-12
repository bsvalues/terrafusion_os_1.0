CREATE TABLE [dbo].[_arb_inquiry_type] (
    [inquiry_type_cd]   VARCHAR (10) NOT NULL,
    [inquiry_type_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     CONSTRAINT [CDF__arb_inquiry_type_sys_flag] DEFAULT ('F') NULL,
    [priority]          INT          CONSTRAINT [CDF__arb_inquiry_type_priority] DEFAULT (1) NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_type] PRIMARY KEY CLUSTERED ([inquiry_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_inquiry_type_delete_insert_update_MemTable
on _arb_inquiry_type
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
where szTableName = '_arb_inquiry_type'

GO

