CREATE TABLE [dbo].[comparable_grid_field_format] (
    [lFieldID]   INT         NOT NULL,
    [bRight]     BIT         NOT NULL,
    [szModifier] VARCHAR (1) NOT NULL,
    [bBold]      BIT         NOT NULL,
    [szGridType] VARCHAR (2) NOT NULL,
    CONSTRAINT [CPK_comparable_grid_field_format] PRIMARY KEY CLUSTERED ([szGridType] ASC, [lFieldID] ASC, [bRight] ASC, [szModifier] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_comparable_grid_field_format_szModifier] CHECK ([szModifier] = '6' or ([szModifier] = '5' or ([szModifier] = '4' or ([szModifier] = '3' or ([szModifier] = '2' or ([szModifier] = '1' or ([szModifier] = '0' or ([szModifier] = '%' or ([szModifier] = ',' or ([szModifier] = '$' or [szModifier] = '')))))))))),
    CONSTRAINT [CFK_comparable_grid_field_format_lFieldID] FOREIGN KEY ([lFieldID]) REFERENCES [dbo].[comp_sales_display_grid_fields] ([lFieldID]) ON DELETE CASCADE
);


GO



create trigger tr_comparable_grid_field_format_delete_insert_update_MemTable
on comparable_grid_field_format
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
where szTableName = 'comparable_grid_field_format'

GO

