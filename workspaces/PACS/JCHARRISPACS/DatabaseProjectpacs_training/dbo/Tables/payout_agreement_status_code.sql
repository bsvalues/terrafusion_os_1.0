CREATE TABLE [dbo].[payout_agreement_status_code] (
    [payout_agreement_status_cd]   VARCHAR (10) NOT NULL,
    [payout_agreement_status_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_payout_agreement_status_code] PRIMARY KEY CLUSTERED ([payout_agreement_status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_payout_agreement_status_code_delete_insert_update_MemTable
on payout_agreement_status_code
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
where szTableName = 'payout_agreement_status_code'

GO

