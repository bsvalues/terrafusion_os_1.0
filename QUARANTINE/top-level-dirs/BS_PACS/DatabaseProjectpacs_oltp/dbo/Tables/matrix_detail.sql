CREATE TABLE [dbo].[matrix_detail] (
    [matrix_id]    INT             NOT NULL,
    [matrix_yr]    NUMERIC (4)     NOT NULL,
    [axis_1_value] VARCHAR (75)    NOT NULL,
    [axis_2_value] VARCHAR (75)    NOT NULL,
    [cell_value]   NUMERIC (16, 2) NOT NULL,
    CONSTRAINT [CPK_matrix_detail] PRIMARY KEY CLUSTERED ([matrix_id] ASC, [matrix_yr] ASC, [axis_1_value] ASC, [axis_2_value] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_matrix_detail_matrix_id_matrix_yr] FOREIGN KEY ([matrix_id], [matrix_yr]) REFERENCES [dbo].[matrix] ([matrix_id], [matrix_yr])
);


GO



create trigger tr_matrix_detail_delete_insert_update_MemTable
on matrix_detail
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
where szTableName = 'matrix_detail'

GO

