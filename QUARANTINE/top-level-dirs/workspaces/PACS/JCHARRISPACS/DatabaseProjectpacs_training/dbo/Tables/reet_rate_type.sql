CREATE TABLE [dbo].[reet_rate_type] (
    [rate_type_cd]   VARCHAR (10) NOT NULL,
    [rate_type_desc] VARCHAR (50) NOT NULL,
    [local_or_state] BIT          NOT NULL,
    CONSTRAINT [CPK_reet_rate_type] PRIMARY KEY CLUSTERED ([rate_type_cd] ASC)
);


GO


create trigger tr_reet_rate_type_delete_insert_update_MemTable
on reet_rate_type
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
where szTableName = 'reet_rate_type'

GO

