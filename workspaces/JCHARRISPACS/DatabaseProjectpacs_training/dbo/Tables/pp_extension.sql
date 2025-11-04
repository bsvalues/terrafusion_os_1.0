CREATE TABLE [dbo].[pp_extension] (
    [code]        VARCHAR (5)  NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    [code_type]   INT          NOT NULL,
    [sys_flag]    VARCHAR (1)  NULL,
    CONSTRAINT [CPK_pp_extension] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_pp_extension_delete_insert_update_MemTable
on pp_extension
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
where szTableName = 'pp_extension'

GO

