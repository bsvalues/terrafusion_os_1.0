CREATE TABLE [dbo].[fund_number] (
    [fund_number]         NUMERIC (14) NOT NULL,
    [description]         VARCHAR (50) NULL,
    [tax_district_id]     INT          NULL,
    [levy_cd]             VARCHAR (10) NOT NULL,
    [display_fund_number] AS           (right('0000000000'+CONVERT([varchar],[fund_number],0),(10))),
    CONSTRAINT [CPK_fund_number] PRIMARY KEY CLUSTERED ([fund_number] ASC, [levy_cd] ASC)
);


GO


create trigger tr_fund_number_delete_insert_update_MemTable
on fund_number
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
where szTableName = 'fund_number'

GO

