CREATE TABLE [dbo].[interest_type] (
    [interest_type_cd]   VARCHAR (5)  NOT NULL,
    [interest_type_desc] VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_interest_type] PRIMARY KEY CLUSTERED ([interest_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_interest_type_delete_insert_update_MemTable
on interest_type
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
where szTableName = 'interest_type'

GO

