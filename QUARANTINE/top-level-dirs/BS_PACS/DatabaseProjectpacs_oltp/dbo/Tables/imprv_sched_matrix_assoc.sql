CREATE TABLE [dbo].[imprv_sched_matrix_assoc] (
    [imprv_det_meth_cd]      CHAR (5)       NOT NULL,
    [imprv_det_type_cd]      CHAR (10)      NOT NULL,
    [imprv_det_class_cd]     CHAR (10)      NOT NULL,
    [imprv_yr]               NUMERIC (4)    NOT NULL,
    [matrix_id]              INT            NOT NULL,
    [matrix_order]           INT            NOT NULL,
    [adj_factor]             NUMERIC (7, 4) NOT NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)   NOT NULL,
    CONSTRAINT [CPK_imprv_sched_matrix_assoc] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [matrix_id] ASC, [matrix_order] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_sched_matrix_assoc_imprv_yr_imprv_det_meth_cd_imprv_det_type_cd_imprv_det_class_cd_imprv_det_sub_class_cd] FOREIGN KEY ([imprv_yr], [imprv_det_meth_cd], [imprv_det_type_cd], [imprv_det_class_cd], [imprv_det_sub_class_cd]) REFERENCES [dbo].[imprv_sched] ([imprv_yr], [imprv_det_meth_cd], [imprv_det_type_cd], [imprv_det_class_cd], [imprv_det_sub_class_cd]),
    CONSTRAINT [CFK_imprv_sched_matrix_assoc_matrix_id_imprv_yr] FOREIGN KEY ([matrix_id], [imprv_yr]) REFERENCES [dbo].[matrix] ([matrix_id], [matrix_yr])
);


GO



create trigger tr_imprv_sched_matrix_assoc_delete_insert_update_MemTable
on imprv_sched_matrix_assoc
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
where szTableName = 'imprv_sched_matrix_assoc'

GO

