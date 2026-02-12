CREATE TABLE [dbo].[county_ratio_code] (
    [ratio_cd]   VARCHAR (10) NOT NULL,
    [ratio_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_county_ratio_code] PRIMARY KEY CLUSTERED ([ratio_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_county_ratio_code_delete_insert_update_MemTable
on county_ratio_code
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
where szTableName = 'county_ratio_code'

GO

