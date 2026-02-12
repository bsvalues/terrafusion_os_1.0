CREATE TABLE [dbo].[land_misc_code_adj_detail] (
    [sched_id]      INT           NOT NULL,
    [year]          NUMERIC (4)   NOT NULL,
    [element_type]  VARCHAR (15)  NOT NULL,
    [element_value] VARCHAR (255) NOT NULL,
    [misc_cd]       AS            (CONVERT([varchar](6),case when [element_type]='Code' then [element_value]  end,0)) PERSISTED,
    CONSTRAINT [CPK_land_misc_code_adj_detail] PRIMARY KEY CLUSTERED ([sched_id] ASC, [year] ASC, [element_type] ASC),
    CONSTRAINT [CFK_land_misc_code_adj_detail_misc_cd] FOREIGN KEY ([misc_cd]) REFERENCES [dbo].[land_misc_code] ([misc_cd]),
    CONSTRAINT [CFK_land_misc_code_adj_detail_sched_id_year] FOREIGN KEY ([sched_id], [year]) REFERENCES [dbo].[land_misc_code_adj] ([sched_id], [year]),
    CONSTRAINT [CFK_land_misc_code_adj_detail_year_element_type] FOREIGN KEY ([year], [element_type]) REFERENCES [dbo].[land_misc_code_adj_lookup_config] ([year], [element_type])
);


GO


create trigger tr_land_misc_code_adj_detail_delete_insert_update_MemTable
on land_misc_code_adj_detail
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
where szTableName = 'land_misc_code_adj_detail'

GO

