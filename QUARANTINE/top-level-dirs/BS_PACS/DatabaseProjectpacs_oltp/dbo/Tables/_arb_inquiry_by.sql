CREATE TABLE [dbo].[_arb_inquiry_by] (
    [inquiry_by_cd]   VARCHAR (10) NOT NULL,
    [inquiry_by_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     CONSTRAINT [CDF__arb_inquiry_by_sys_flag] DEFAULT ('F') NULL,
    [manual_entry]    BIT          CONSTRAINT [CDF__arb_inquiry_by_manual_entry] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_by] PRIMARY KEY CLUSTERED ([inquiry_by_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

create trigger tr__arb_inquiry_by_delete_insert_update_MemTable
on _arb_inquiry_by
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
where szTableName = '_arb_inquiry_by'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Allow user to manually enter ARB Inquiry By', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry_by', @level2type = N'COLUMN', @level2name = N'manual_entry';


GO

