CREATE TABLE [dbo].[_arb_protest_panel_member_cd] (
    [member_cd]     VARCHAR (10) NOT NULL,
    [member_desc]   VARCHAR (50) NULL,
    [inactive_flag] BIT          NOT NULL,
    CONSTRAINT [CPK__arb_protest_panel_member_cd] PRIMARY KEY CLUSTERED ([member_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_protest_panel_member_cd_delete_insert_update_MemTable
on _arb_protest_panel_member_cd
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
where szTableName = '_arb_protest_panel_member_cd'

GO

