CREATE TABLE [dbo].[mortgage_co] (
    [mortgage_co_id] INT          NOT NULL,
    [mortgage_cd]    VARCHAR (10) NULL,
    [taxserver]      VARCHAR (30) NULL,
    [taxserver_id]   INT          NULL,
    [lender_num]     VARCHAR (30) NULL,
    CONSTRAINT [CPK_mortgage_co] PRIMARY KEY CLUSTERED ([mortgage_co_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mortgage_co_mortgage_co_id] FOREIGN KEY ([mortgage_co_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO


create trigger tr_mortgage_co_delete_insert_update_MemTable
on mortgage_co
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
where szTableName = 'mortgage_co'

GO

