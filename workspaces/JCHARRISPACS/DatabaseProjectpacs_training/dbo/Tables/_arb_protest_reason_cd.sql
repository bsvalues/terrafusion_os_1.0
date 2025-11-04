CREATE TABLE [dbo].[_arb_protest_reason_cd] (
    [reason_cd]   VARCHAR (10)  NOT NULL,
    [reason_desc] VARCHAR (100) NULL,
    [sys_flag]    CHAR (1)      CONSTRAINT [CDF__arb_protest_reason_cd_sys_flag] DEFAULT ('F') NULL,
    [equity_flag] BIT           NOT NULL,
    CONSTRAINT [CPK__arb_protest_reason_cd] PRIMARY KEY CLUSTERED ([reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

create trigger tr__arb_protest_reason_cd_delete_insert_update_MemTable
on _arb_protest_reason_cd
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
where szTableName = '_arb_protest_reason_cd'

GO

