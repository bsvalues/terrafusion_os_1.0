CREATE TABLE [dbo].[imprv_sched_detail_quality_comp] (
    [imprv_yr]           NUMERIC (4)     NOT NULL,
    [subject_quality_cd] VARCHAR (10)    NOT NULL,
    [comp_quality_cd]    VARCHAR (10)    NOT NULL,
    [system_adj_factor]  NUMERIC (14, 2) NOT NULL,
    [user_adj_factor]    NUMERIC (14, 2) NOT NULL,
    [use_system_flag]    CHAR (1)        NOT NULL,
    [adj_factor]         AS              (case when ([use_system_flag] = 'T') then [system_adj_factor] else [user_adj_factor] end),
    [szMethod]           VARCHAR (255)   NOT NULL,
    [szImprovMethod]     VARCHAR (5)     CONSTRAINT [CDF_imprv_sched_detail_quality_comp_szImprovMethod] DEFAULT ('R') NOT NULL,
    CONSTRAINT [CPK_imprv_sched_detail_quality_comp] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [subject_quality_cd] ASC, [comp_quality_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_imprv_sched_detail_quality_comp_delete_insert_update_MemTable
on imprv_sched_detail_quality_comp
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
where szTableName = 'imprv_sched_detail_quality_comp'

GO

