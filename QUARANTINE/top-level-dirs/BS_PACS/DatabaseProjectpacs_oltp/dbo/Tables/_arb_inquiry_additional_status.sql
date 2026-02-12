CREATE TABLE [dbo].[_arb_inquiry_additional_status] (
    [status_cd]       VARCHAR (10) NOT NULL,
    [status_desc]     VARCHAR (50) NULL,
    [generate_letter] CHAR (1)     NULL,
    [letter_type]     INT          NULL,
    [close_case]      CHAR (1)     NULL,
    [sys_flag]        CHAR (1)     CONSTRAINT [CDF__arb_inquiry_additional_status_sys_flag] DEFAULT ('F') NULL,
    CONSTRAINT [CPK__arb_inquiry_additional_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


CREATE trigger [dbo].[tr__arb_inquiry_additional_status_delete_insert_update_MemTable]
on [dbo].[_arb_inquiry_additional_status]
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
where szTableName = '_arb_inquiry_additional_status'

GO

