CREATE TABLE [dbo].[appr_company] (
    [appr_company_id] INT           NOT NULL,
    [appr_company_nm] VARCHAR (100) NULL,
    [sys_flag]        CHAR (1)      NULL,
    CONSTRAINT [CPK_appr_company] PRIMARY KEY CLUSTERED ([appr_company_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_appr_company_delete_insert_update_MemTable
on appr_company
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
where szTableName = 'appr_company'

GO

