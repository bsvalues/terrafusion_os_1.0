CREATE TABLE [dbo].[account_group_code] (
    [group_cd]     VARCHAR (20) NOT NULL,
    [acct_type_cd] VARCHAR (5)  NOT NULL,
    [group_desc]   VARCHAR (50) NULL,
    [sys_flag]     VARCHAR (1)  NULL,
    [alert_user]   VARCHAR (1)  NULL,
    CONSTRAINT [CPK_account_group_code] PRIMARY KEY CLUSTERED ([group_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_account_group_code_delete_insert_update_MemTable
on account_group_code
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
where szTableName = 'account_group_code'

GO

