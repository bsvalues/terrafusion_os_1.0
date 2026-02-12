CREATE TABLE [dbo].[matrix_axis_detail] (
    [matrix_id]   INT          NOT NULL,
    [matrix_yr]   NUMERIC (4)  NOT NULL,
    [axis_value]  VARCHAR (75) NOT NULL,
    [axis_number] INT          NOT NULL,
    [axis_order]  INT          NULL,
    CONSTRAINT [CPK_matrix_axis_detail] PRIMARY KEY CLUSTERED ([matrix_id] ASC, [matrix_yr] ASC, [axis_value] ASC, [axis_number] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_matrix_axis_detail_delete_insert_update_MemTable
on matrix_axis_detail
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
where szTableName = 'matrix_axis_detail'

GO

