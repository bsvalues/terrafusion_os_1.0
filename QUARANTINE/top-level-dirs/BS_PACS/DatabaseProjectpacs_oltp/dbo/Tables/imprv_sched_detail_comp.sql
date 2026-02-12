CREATE TABLE [dbo].[imprv_sched_detail_comp] (
    [imprv_det_meth_cd]      VARCHAR (5)     NOT NULL,
    [imprv_seg_type_cd]      VARCHAR (10)    NOT NULL,
    [imprv_seg_quality_cd]   VARCHAR (10)    NOT NULL,
    [imprv_yr]               NUMERIC (4)     NOT NULL,
    [sqft_max]               NUMERIC (18, 1) NOT NULL,
    [system_adj_factor]      NUMERIC (14, 2) NOT NULL,
    [user_adj_factor]        NUMERIC (14, 2) NOT NULL,
    [use_system_flag]        CHAR (1)        NOT NULL,
    [adj_factor]             AS              (case when [use_system_flag]='T' then [system_adj_factor] else [user_adj_factor] end),
    [midpoint_flag]          CHAR (1)        NOT NULL,
    [szMethod]               VARCHAR (255)   NOT NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NOT NULL,
    CONSTRAINT [CPK_imprv_sched_detail_comp] PRIMARY KEY CLUSTERED ([imprv_det_meth_cd] ASC, [imprv_seg_type_cd] ASC, [imprv_seg_quality_cd] ASC, [imprv_yr] ASC, [sqft_max] ASC, [imprv_det_sub_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

create trigger tr_imprv_sched_detail_comp_delete_insert_update_MemTable
on dbo.imprv_sched_detail_comp
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
where szTableName = 'imprv_sched_detail_comp'

GO

