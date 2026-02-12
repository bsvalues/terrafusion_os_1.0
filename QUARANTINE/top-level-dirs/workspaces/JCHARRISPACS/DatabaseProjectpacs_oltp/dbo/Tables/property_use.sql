CREATE TABLE [dbo].[property_use] (
    [property_use_cd]   VARCHAR (10) NOT NULL,
    [property_use_desc] VARCHAR (50) NOT NULL,
    [dor_use_code]      VARCHAR (10) NULL,
    CONSTRAINT [CPK_property_use] PRIMARY KEY CLUSTERED ([property_use_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_use_dor_use_code] FOREIGN KEY ([dor_use_code]) REFERENCES [dbo].[dor_use_code] ([sub_cd])
);


GO



create trigger tr_property_use_delete_insert_update_MemTable
on property_use
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
where szTableName = 'property_use'

GO

