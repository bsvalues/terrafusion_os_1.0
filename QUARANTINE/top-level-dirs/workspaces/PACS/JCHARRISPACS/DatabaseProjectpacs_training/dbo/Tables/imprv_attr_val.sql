CREATE TABLE [dbo].[imprv_attr_val] (
    [imprv_attr_id]          INT             NOT NULL,
    [imprv_attr_val_cd]      VARCHAR (75)    NOT NULL,
    [imprv_det_meth_cd]      CHAR (5)        NOT NULL,
    [imprv_det_type_cd]      CHAR (10)       NOT NULL,
    [imprv_det_class_cd]     CHAR (10)       NOT NULL,
    [imprv_yr]               NUMERIC (4)     NOT NULL,
    [imprv_attr_base_up]     NUMERIC (14, 2) NULL,
    [imprv_attr_up]          NUMERIC (14, 2) NULL,
    [imprv_attr_base_incr]   NUMERIC (14, 2) NULL,
    [imprv_attr_incr]        NUMERIC (14, 2) NULL,
    [imprv_attr_pct]         NUMERIC (5, 2)  NULL,
    [imprv_attr_adj_factor]  NUMERIC (5, 2)  NULL,
    [imprv_attr_unit_cost]   NUMERIC (14, 2) NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NOT NULL,
    CONSTRAINT [CPK_imprv_attr_val] PRIMARY KEY CLUSTERED ([imprv_attr_id] ASC, [imprv_attr_val_cd] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [imprv_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_attr_val_imprv_attr_id_imprv_attr_val_cd] FOREIGN KEY ([imprv_attr_id], [imprv_attr_val_cd]) REFERENCES [dbo].[attribute_val] ([imprv_attr_id], [imprv_attr_val_cd])
);


GO



create trigger tr_imprv_attr_val_delete_insert_update_MemTable
on imprv_attr_val
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
where szTableName = 'imprv_attr_val'

GO

