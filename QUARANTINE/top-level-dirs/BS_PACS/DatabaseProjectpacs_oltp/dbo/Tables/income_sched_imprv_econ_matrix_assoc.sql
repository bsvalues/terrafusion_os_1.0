CREATE TABLE [dbo].[income_sched_imprv_econ_matrix_assoc] (
    [year]              NUMERIC (4)    NOT NULL,
    [economic_area]     VARCHAR (10)   NOT NULL,
    [imprv_det_type_cd] CHAR (10)      NOT NULL,
    [imprv_det_meth_cd] CHAR (5)       NOT NULL,
    [matrix_id]         INT            NOT NULL,
    [matrix_order]      INT            NOT NULL,
    [adj_factor]        NUMERIC (7, 4) NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_econ_matrix_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [economic_area] ASC, [imprv_det_type_cd] ASC, [imprv_det_meth_cd] ASC, [matrix_id] ASC, [matrix_order] ASC),
    CONSTRAINT [CFK_income_sched_imprv_econ_matrix_assoc_income_sched_imprv_detail] FOREIGN KEY ([year], [economic_area], [imprv_det_type_cd], [imprv_det_meth_cd]) REFERENCES [dbo].[income_sched_imprv_econ] ([year], [economic_area], [imprv_det_type_cd], [imprv_det_meth_cd]),
    CONSTRAINT [CFK_income_sched_imprv_econ_matrix_assoc_matrix] FOREIGN KEY ([matrix_id], [year]) REFERENCES [dbo].[matrix] ([matrix_id], [matrix_yr])
);


GO


create trigger [dbo].[tr_income_sched_imprv_econ_matrix_assoc_delete_insert_update_MemTable]
on [dbo].[income_sched_imprv_econ_matrix_assoc]
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
where szTableName = 'income_sched_imprv_econ_matrix_assoc'

GO

