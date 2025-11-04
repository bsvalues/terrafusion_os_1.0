CREATE TABLE [dbo].[_arb_inquiry_status] (
    [status_cd]       VARCHAR (10) NOT NULL,
    [status_desc]     VARCHAR (50) NULL,
    [generate_letter] CHAR (1)     NULL,
    [letter_type]     INT          NULL,
    [close_case]      CHAR (1)     NULL,
    [sys_flag]        CHAR (1)     CONSTRAINT [CDF__arb_inquiry_status_sys_flag] DEFAULT ('F') NULL,
    [inactive]        BIT          CONSTRAINT [CDF__arb_inquiry_status_inactive] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_inquiry_status_delete_insert_update_MemTable
on _arb_inquiry_status
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
where szTableName = '_arb_inquiry_status'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether the inquiry status code is inactive', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry_status', @level2type = N'COLUMN', @level2name = N'inactive';


GO

