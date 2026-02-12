CREATE TABLE [dbo].[comp_sales_display_grid_layout] (
    [lGridLayoutID] INT          IDENTITY (100000000, 1) NOT NULL,
    [lGridID]       INT          NOT NULL,
    [lFieldID]      INT          NOT NULL,
    [szCustomText]  VARCHAR (50) NULL,
    CONSTRAINT [CPK_comp_sales_display_grid_layout] PRIMARY KEY CLUSTERED ([lGridLayoutID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comp_sales_display_grid_layout_lFieldID] FOREIGN KEY ([lFieldID]) REFERENCES [dbo].[comp_sales_display_grid_fields] ([lFieldID]),
    CONSTRAINT [CFK_comp_sales_display_grid_layout_lGridID] FOREIGN KEY ([lGridID]) REFERENCES [dbo].[comp_sales_display_grid] ([lGridID])
);


GO

CREATE NONCLUSTERED INDEX [idx_lGridID]
    ON [dbo].[comp_sales_display_grid_layout]([lGridID] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_comp_sales_display_grid_layout_delete_insert_update_MemTable
on comp_sales_display_grid_layout
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
where szTableName = 'comp_sales_display_grid_layout'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Custom Text for <blank line> fields', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_display_grid_layout', @level2type = N'COLUMN', @level2name = N'szCustomText';


GO

