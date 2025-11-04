CREATE TABLE [dbo].[levy_exemption_type] (
    [levy_exemption_type_cd]   VARCHAR (10) NOT NULL,
    [levy_exemption_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_levy_exemption_type] PRIMARY KEY CLUSTERED ([levy_exemption_type_cd] ASC)
);


GO

create trigger [dbo].[tr_levy_exemption_type_delete_insert_update_MemTable]
on [dbo].levy_exemption_type
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
where szTableName = 'levy_exemption_type'

GO

