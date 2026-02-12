CREATE TABLE [dbo].[bp_issuer_status_cd] (
    [IssuerStatus] VARCHAR (5)  NOT NULL,
    [Description]  VARCHAR (50) NULL,
    CONSTRAINT [CPK_bp_issuer_status_cd] PRIMARY KEY CLUSTERED ([IssuerStatus] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_bp_issuer_status_cd_delete_insert_update_MemTable
on bp_issuer_status_cd
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
where szTableName = 'bp_issuer_status_cd'

GO

