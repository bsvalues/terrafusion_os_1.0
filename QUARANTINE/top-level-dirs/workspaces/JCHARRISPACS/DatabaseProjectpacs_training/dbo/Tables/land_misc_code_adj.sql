CREATE TABLE [dbo].[land_misc_code_adj] (
    [sched_id]    INT             NOT NULL,
    [year]        NUMERIC (4)     NOT NULL,
    [value]       NUMERIC (14, 2) NOT NULL,
    [adj_pct]     NUMERIC (5, 2)  NOT NULL,
    [adj_value]   NUMERIC (14)    NOT NULL,
    [apply_to_hs] BIT             CONSTRAINT [CDF_land_misc_code_adj_apply_to_hs] DEFAULT ((0)) NOT NULL,
    [is_percent]  BIT             CONSTRAINT [CDF_land_misc_code_adj_is_percent] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_land_misc_code_adj] PRIMARY KEY CLUSTERED ([sched_id] ASC, [year] ASC)
);


GO


create trigger tr_land_misc_code_adj_delete_insert_update_MemTable
on land_misc_code_adj
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
where szTableName = 'land_misc_code_adj'

GO

