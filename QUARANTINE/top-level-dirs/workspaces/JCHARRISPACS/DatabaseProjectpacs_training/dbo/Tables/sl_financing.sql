CREATE TABLE [dbo].[sl_financing] (
    [sl_financing_cd]   CHAR (5)     NOT NULL,
    [sl_financing_desc] VARCHAR (30) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_sl_financing] PRIMARY KEY CLUSTERED ([sl_financing_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_sl_financing_delete_insert_update_MemTable
on sl_financing
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
where szTableName = 'sl_financing'

GO

