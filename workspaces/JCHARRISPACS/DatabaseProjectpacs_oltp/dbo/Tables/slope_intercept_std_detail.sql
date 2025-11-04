CREATE TABLE [dbo].[slope_intercept_std_detail] (
    [sid_hood_cd]   VARCHAR (10)    NOT NULL,
    [sid_type_cd]   VARCHAR (5)     NOT NULL,
    [sid_year]      NUMERIC (4)     NOT NULL,
    [sid_detail_id] INT             NOT NULL,
    [condition_cd]  VARCHAR (5)     NOT NULL,
    [heat_ac_cd]    VARCHAR (75)    NOT NULL,
    [age_max]       INT             NOT NULL,
    [slope]         NUMERIC (14, 5) NOT NULL,
    [y_intercept]   NUMERIC (14, 5) NOT NULL,
    CONSTRAINT [CPK_slope_intercept_std_detail] PRIMARY KEY CLUSTERED ([sid_year] ASC, [sid_hood_cd] ASC, [sid_type_cd] ASC, [sid_detail_id] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_slope_intercept_std_detail_delete_insert_update_MemTable
on slope_intercept_std_detail
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
where szTableName = 'slope_intercept_std_detail'

GO

