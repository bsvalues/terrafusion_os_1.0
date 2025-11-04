CREATE TABLE [dbo].[condo_plot_code] (
    [plot_cd]   VARCHAR (10) NOT NULL,
    [plot_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_plot_code] PRIMARY KEY CLUSTERED ([plot_cd] ASC)
);


GO


create trigger tr_condo_plot_code_delete_insert_update_MemTable
on condo_plot_code
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
where szTableName = 'condo_plot_code'

GO

