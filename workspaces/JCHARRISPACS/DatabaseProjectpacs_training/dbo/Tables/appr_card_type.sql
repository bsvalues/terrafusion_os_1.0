CREATE TABLE [dbo].[appr_card_type] (
    [appr_card_type] VARCHAR (15) NOT NULL,
    [appr_card_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_appr_card_type] PRIMARY KEY CLUSTERED ([appr_card_type] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_appr_card_type_delete_insert_update_MemTable
on appr_card_type
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
where szTableName = 'appr_card_type'

GO

