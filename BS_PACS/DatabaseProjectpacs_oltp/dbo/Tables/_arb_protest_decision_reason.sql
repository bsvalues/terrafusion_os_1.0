CREATE TABLE [dbo].[_arb_protest_decision_reason] (
    [decision_reason_cd]      VARCHAR (10) NOT NULL,
    [decision_reason_desc]    VARCHAR (50) NULL,
    [qualify_for_arbitration] BIT          NOT NULL,
    [sys_flag]                BIT          NOT NULL,
    CONSTRAINT [CPK__arb_protest_decision_reason] PRIMARY KEY CLUSTERED ([decision_reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_protest_decision_reason_delete_insert_update_MemTable
on _arb_protest_decision_reason
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
where szTableName = '_arb_protest_decision_reason'

GO

