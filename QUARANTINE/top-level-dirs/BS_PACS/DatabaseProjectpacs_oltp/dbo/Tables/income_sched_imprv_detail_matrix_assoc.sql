CREATE TABLE [dbo].[income_sched_imprv_detail_matrix_assoc] (
    [year]              NUMERIC (4)    NOT NULL,
    [hood_cd]           VARCHAR (10)   NOT NULL,
    [imprv_det_type_cd] CHAR (10)      NOT NULL,
    [imprv_det_meth_cd] CHAR (5)       NOT NULL,
    [matrix_id]         INT            NOT NULL,
    [matrix_order]      INT            NOT NULL,
    [adj_factor]        NUMERIC (7, 4) NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_detail_matrix_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [hood_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_meth_cd] ASC, [matrix_id] ASC, [matrix_order] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_sched_imprv_detail_matrix_assoc_income_sched_imprv_detail] FOREIGN KEY ([year], [hood_cd], [imprv_det_type_cd], [imprv_det_meth_cd]) REFERENCES [dbo].[income_sched_imprv_detail] ([year], [hood_cd], [imprv_det_type_cd], [imprv_det_meth_cd]),
    CONSTRAINT [CFK_income_sched_imprv_detail_matrix_assoc_matrix] FOREIGN KEY ([matrix_id], [year]) REFERENCES [dbo].[matrix] ([matrix_id], [matrix_yr])
);


GO


create trigger tr_income_sched_imprv_detail_matrix_assoc_delete_insert_update_MemTable
on income_sched_imprv_detail_matrix_assoc
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
where szTableName = 'income_sched_imprv_detail_matrix_assoc'

GO

