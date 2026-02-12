CREATE TABLE [dbo].[_arb_inquiry_nature] (
    [inquiry_nature_cd]   VARCHAR (10) NOT NULL,
    [inquiry_nature_desc] VARCHAR (50) NULL,
    [sys_flag]            CHAR (1)     CONSTRAINT [CDF__arb_inquiry_nature_sys_flag] DEFAULT ('F') NULL,
    CONSTRAINT [CPK__arb_inquiry_nature] PRIMARY KEY CLUSTERED ([inquiry_nature_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_inquiry_nature_delete_insert_update_MemTable
on _arb_inquiry_nature
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
where szTableName = '_arb_inquiry_nature'

GO

