CREATE TABLE [dbo].[land_misc_code_adj_lookup_config] (
    [year]         NUMERIC (4)    NOT NULL,
    [element_type] VARCHAR (15)   NOT NULL,
    [is_active]    BIT            NOT NULL,
    [lookup_query] VARCHAR (1023) NOT NULL,
    CONSTRAINT [CPK_land_misc_code_adj_lookup_config] PRIMARY KEY CLUSTERED ([year] ASC, [element_type] ASC)
);


GO


create trigger tr_land_misc_code_adj_lookup_config_delete_insert_update_MemTable
on land_misc_code_adj_lookup_config
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
where szTableName = 'land_misc_code_adj_lookup_config'

GO

