CREATE TABLE [dbo].[prop_range] (
    [range_code]   VARCHAR (20) NOT NULL,
    [range_year]   NUMERIC (4)  NOT NULL,
    [range_desc]   VARCHAR (60) NOT NULL,
    [created_date] DATETIME     CONSTRAINT [DF_range_created_date] DEFAULT (getdate()) NULL,
    CONSTRAINT [CPK_prop_range] PRIMARY KEY CLUSTERED ([range_code] ASC, [range_year] ASC)
);


GO


create trigger tr_prop_range_delete_insert_update_MemTable
on prop_range
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
where szTableName = 'prop_range'

GO

