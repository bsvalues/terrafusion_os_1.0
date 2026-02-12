CREATE TABLE [dbo].[slope_intercept_deprec] (
    [sid_hood_cd] VARCHAR (10) NOT NULL,
    [sid_type_cd] VARCHAR (5)  NOT NULL,
    [sid_year]    NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_slope_intercept_deprec] PRIMARY KEY CLUSTERED ([sid_year] ASC, [sid_hood_cd] ASC, [sid_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_slope_intercept_deprec_delete_insert_update_MemTable
on slope_intercept_deprec
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
where szTableName = 'slope_intercept_deprec'

GO

