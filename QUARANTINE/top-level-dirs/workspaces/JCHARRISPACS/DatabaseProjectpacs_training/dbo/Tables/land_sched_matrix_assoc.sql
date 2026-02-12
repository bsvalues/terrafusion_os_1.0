CREATE TABLE [dbo].[land_sched_matrix_assoc] (
    [ls_id]        INT            NOT NULL,
    [ls_year]      NUMERIC (4)    NOT NULL,
    [matrix_id]    INT            NOT NULL,
    [matrix_order] INT            NOT NULL,
    [adj_factor]   NUMERIC (7, 4) NULL,
    CONSTRAINT [CPK_land_sched_matrix_assoc] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [matrix_id] ASC, [matrix_order] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_sched_matrix_assoc_ls_id_ls_year] FOREIGN KEY ([ls_id], [ls_year]) REFERENCES [dbo].[land_sched] ([ls_id], [ls_year]),
    CONSTRAINT [CFK_land_sched_matrix_assoc_matrix_id_ls_year] FOREIGN KEY ([matrix_id], [ls_year]) REFERENCES [dbo].[matrix] ([matrix_id], [matrix_yr])
);


GO



create trigger tr_land_sched_matrix_assoc_delete_insert_update_MemTable
on land_sched_matrix_assoc
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
where szTableName = 'land_sched_matrix_assoc'

GO

