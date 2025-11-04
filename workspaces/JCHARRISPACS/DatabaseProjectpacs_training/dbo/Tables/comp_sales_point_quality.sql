CREATE TABLE [dbo].[comp_sales_point_quality] (
    [lQualityDiff] INT         NOT NULL,
    [lPoints]      INT         NOT NULL,
    [lYear]        NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_quality] PRIMARY KEY CLUSTERED ([lYear] ASC, [lQualityDiff] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_comp_sales_point_quality_delete_insert_update_MemTable
on comp_sales_point_quality
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
where szTableName = 'comp_sales_point_quality'

GO

